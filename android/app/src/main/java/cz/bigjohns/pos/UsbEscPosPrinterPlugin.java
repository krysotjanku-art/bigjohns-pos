package cz.bigjohns.pos;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.Charset;
import java.util.ArrayDeque;
import java.util.Map;

@CapacitorPlugin(name = "UsbEscPosPrinter")
public class UsbEscPosPrinterPlugin extends Plugin {
    private static final String TAG = "UsbEscPosPrinter";
    private static final String USB_PERMISSION = "cz.bigjohns.pos.USB_PRINTER_PERMISSION";
    private static final int MAX_POST_CUT_WAIT_MS = 1500;
    private static final int USB_WRITE_CHUNK_BYTES = 2048;

    private final Object printLock = new Object();
    private final ArrayDeque<PrintRequest> printQueue = new ArrayDeque<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean printerBusy;
    private PrintRequest permissionRequest;
    private BroadcastReceiver permissionReceiver;

    private static final class PrintRequest {
        final PluginCall call;
        final String content;
        final String jobName;
        final int postCutWaitMs;

        PrintRequest(PluginCall call, String content, String jobName, int postCutWaitMs) {
            this.call = call;
            this.content = content;
            this.jobName = jobName;
            this.postCutWaitMs = postCutWaitMs;
        }
    }

    @Override
    public void load() {
        permissionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!USB_PERMISSION.equals(intent.getAction())) return;
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                PrintRequest request;
                synchronized (printLock) {
                    request = permissionRequest;
                    permissionRequest = null;
                }
                if (request == null) return;
                if (granted && device != null) {
                    log(request, "USB permission granted; starting queued job");
                    writeJob(device, request);
                } else {
                    failJob(request, "Přístup k USB tiskárně nebyl povolen.");
                }
            }
        };
        IntentFilter filter = new IntentFilter(USB_PERMISSION);
        ContextCompat.registerReceiver(getContext(), permissionReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    protected void handleOnDestroy() {
        if (permissionReceiver != null) getContext().unregisterReceiver(permissionReceiver);
        super.handleOnDestroy();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        UsbDevice device = findPrinter();
        UsbManager manager = usbManager();
        JSObject result = new JSObject();
        result.put("connected", device != null);
        result.put("permissionGranted", device != null && manager.hasPermission(device));
        result.put("printerName", device == null ? null : printerName(device));
        result.put("message", device == null ? "Tiskárna RONGTA RP80-USE není připojena přes USB." : manager.hasPermission(device) ? "Tiskárna RONGTA RP80-USE je připravena." : "Tiskárna je připojena. Při prvním tisku bude vyžádáno USB oprávnění.");
        call.resolve(result);
    }

    @PluginMethod
    public void print(PluginCall call) {
        String content = call.getString("content", "");
        String jobName = call.getString("jobName", "receipt");
        int postCutWaitMs = Math.max(0, Math.min(call.getInt("postCutWaitMs", 0), MAX_POST_CUT_WAIT_MS));
        if (content.trim().isEmpty()) {
            call.reject("Obsah účtenky je prázdný.");
            return;
        }
        enqueue(new PrintRequest(call, content, jobName, postCutWaitMs));
    }

    private void enqueue(PrintRequest request) {
        boolean startNow = false;
        synchronized (printLock) {
            printQueue.add(request);
            if (!printerBusy) {
                printerBusy = true;
                startNow = true;
            }
        }
        log(request, startNow ? "printer lock acquired" : "queued behind active printer job");
        if (startNow) processNext();
    }

    /** One request owns the printer until its payload, feed, cut, and settle time finish. */
    private void processNext() {
        PrintRequest request;
        synchronized (printLock) {
            request = printQueue.poll();
            if (request == null) {
                printerBusy = false;
                Log.i(TAG, "printer lock released ts=" + System.currentTimeMillis());
                return;
            }
        }

        UsbDevice device = findPrinter();
        if (device == null) {
            failJob(request, "Tiskárna RONGTA RP80-USE není připojena přes USB.");
            return;
        }
        UsbManager manager = usbManager();
        if (!manager.hasPermission(device)) {
            synchronized (printLock) {
                permissionRequest = request;
            }
            log(request, "requesting USB permission");
            Intent permissionIntent = new Intent(USB_PERMISSION).setPackage(getContext().getPackageName());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0);
            manager.requestPermission(device, PendingIntent.getBroadcast(getContext(), 0, permissionIntent, flags));
            return;
        }
        writeJob(device, request);
    }

    private UsbManager usbManager() {
        return (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
    }

    private UsbDevice findPrinter() {
        for (Map.Entry<String, UsbDevice> entry : usbManager().getDeviceList().entrySet()) {
            UsbDevice device = entry.getValue();
            String name = (device.getDeviceName() + " " + device.getProductName()).toLowerCase();
            if (name.contains("rongta") || name.contains("rp80") || hasBulkOutEndpoint(device)) return device;
        }
        return null;
    }

    private boolean hasBulkOutEndpoint(UsbDevice device) {
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            UsbInterface usbInterface = device.getInterface(i);
            for (int endpointIndex = 0; endpointIndex < usbInterface.getEndpointCount(); endpointIndex++) {
                UsbEndpoint endpoint = usbInterface.getEndpoint(endpointIndex);
                if (endpoint.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK && endpoint.getDirection() == UsbConstants.USB_DIR_OUT) return true;
            }
        }
        return false;
    }

    private void writeJob(UsbDevice device, PrintRequest request) {
        UsbDeviceConnection connection = usbManager().openDevice(device);
        if (connection == null) {
            failJob(request, "Nepodařilo se otevřít USB tiskárnu.");
            return;
        }
        UsbInterface printerInterface = null;
        UsbEndpoint output = null;
        for (int i = 0; i < device.getInterfaceCount() && output == null; i++) {
            UsbInterface candidate = device.getInterface(i);
            for (int j = 0; j < candidate.getEndpointCount(); j++) {
                UsbEndpoint endpoint = candidate.getEndpoint(j);
                if (endpoint.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK && endpoint.getDirection() == UsbConstants.USB_DIR_OUT) {
                    printerInterface = candidate;
                    output = endpoint;
                    break;
                }
            }
        }
        if (printerInterface == null || output == null || !connection.claimInterface(printerInterface, true)) {
            connection.close();
            failJob(request, "USB rozhraní tiskárny není dostupné.");
            return;
        }

        boolean ok;
        try {
            byte[] init = new byte[] { 0x1B, 0x40, 0x1B, 0x74, 0x12 };
            byte[] receipt = request.content.getBytes(Charset.forName("CP852"));
            // Each queued request is one independent ESC/POS job: reset,
            // content (including feed), then the job's own full cut.
            byte[] finish = new byte[] { 0x1D, 0x56, 0x00 };
            byte[] payload = new byte[init.length + receipt.length + finish.length];
            System.arraycopy(init, 0, payload, 0, init.length);
            System.arraycopy(receipt, 0, payload, init.length, receipt.length);
            System.arraycopy(finish, 0, payload, init.length + receipt.length, finish.length);
            log(request, "USB write started bytes=" + payload.length);
            ok = writeFully(connection, output, payload, request);
        } finally {
            connection.releaseInterface(printerInterface);
            connection.close();
        }

        if (!ok) {
            failJob(request, "Tiskárna nepřijala kompletní data účtenky.");
            return;
        }
        log(request, "USB write and cut command completed");
        JSObject result = new JSObject();
        result.put("printerName", printerName(device));
        if (request.postCutWaitMs == 0) {
            completeJob(request, result);
            return;
        }
        log(request, "post-cut wait started ms=" + request.postCutWaitMs);
        mainHandler.postDelayed(() -> completeJob(request, result), request.postCutWaitMs);
    }

    /** Writes every chunk synchronously and rejects any short USB transfer. */
    private boolean writeFully(UsbDeviceConnection connection, UsbEndpoint endpoint, byte[] data, PrintRequest request) {
        int offset = 0;
        while (offset < data.length) {
            int length = Math.min(USB_WRITE_CHUNK_BYTES, data.length - offset);
            int transferred = connection.bulkTransfer(endpoint, data, offset, length, 5000);
            Log.i(TAG, "job=" + request.jobName + " ts=" + System.currentTimeMillis() + " bulkTransfer offset=" + offset + " requested=" + length + " returned=" + transferred);
            if (transferred != length) {
                Log.e(TAG, "job=" + request.jobName + " short/failed USB transfer; refusing to start another job");
                return false;
            }
            offset += transferred;
        }
        return true;
    }

    private void completeJob(PrintRequest request, JSObject result) {
        log(request, "job completed; cut settled");
        request.call.resolve(result);
        processNext();
    }

    private void failJob(PrintRequest request, String message) {
        Log.e(TAG, "job=" + request.jobName + " ts=" + System.currentTimeMillis() + " failed: " + message);
        request.call.reject(message);
        processNext();
    }

    private void log(PrintRequest request, String event) {
        Log.i(TAG, "job=" + request.jobName + " ts=" + System.currentTimeMillis() + " chars=" + request.content.length() + " " + event);
    }

    private String printerName(UsbDevice device) {
        return device.getProductName() == null ? "RONGTA RP80-USE" : device.getProductName();
    }
}
