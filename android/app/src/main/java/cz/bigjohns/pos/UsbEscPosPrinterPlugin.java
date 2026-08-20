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

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "UsbEscPosPrinter")
public class UsbEscPosPrinterPlugin extends Plugin {
    private static final String USB_PERMISSION = "cz.bigjohns.pos.USB_PRINTER_PERMISSION";
    private PluginCall pendingPrint;
    private String pendingContent;
    private BroadcastReceiver permissionReceiver;

    @Override
    public void load() {
        permissionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!USB_PERMISSION.equals(intent.getAction())) return;
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                if (pendingPrint == null) return;
                PluginCall call = pendingPrint;
                String content = pendingContent;
                pendingPrint = null;
                pendingContent = null;
                if (granted && device != null) print(device, content, call);
                else call.reject("Přístup k USB tiskárně nebyl povolen.");
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
        if (content.trim().isEmpty()) { call.reject("Obsah účtenky je prázdný."); return; }
        UsbDevice device = findPrinter();
        if (device == null) { call.reject("Tiskárna RONGTA RP80-USE není připojena přes USB."); return; }
        UsbManager manager = usbManager();
        if (!manager.hasPermission(device)) {
            pendingPrint = call;
            pendingContent = content;
            Intent permissionIntent = new Intent(USB_PERMISSION).setPackage(getContext().getPackageName());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0);
            manager.requestPermission(device, PendingIntent.getBroadcast(getContext(), 0, permissionIntent, flags));
            return;
        }
        print(device, content, call);
    }

    private UsbManager usbManager() { return (UsbManager) getContext().getSystemService(Context.USB_SERVICE); }

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

    private void print(UsbDevice device, String content, PluginCall call) {
        UsbManager manager = usbManager();
        UsbDeviceConnection connection = manager.openDevice(device);
        if (connection == null) { call.reject("Nepodařilo se otevřít USB tiskárnu."); return; }
        UsbInterface printerInterface = null;
        UsbEndpoint output = null;
        for (int i = 0; i < device.getInterfaceCount() && output == null; i++) {
            UsbInterface candidate = device.getInterface(i);
            for (int j = 0; j < candidate.getEndpointCount(); j++) {
                UsbEndpoint endpoint = candidate.getEndpoint(j);
                if (endpoint.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK && endpoint.getDirection() == UsbConstants.USB_DIR_OUT) { printerInterface = candidate; output = endpoint; break; }
            }
        }
        if (printerInterface == null || output == null || !connection.claimInterface(printerInterface, true)) { connection.close(); call.reject("USB rozhraní tiskárny není dostupné."); return; }
        byte[] init = new byte[] { 0x1B, 0x40, 0x1B, 0x74, 0x12 };
        byte[] receipt = content.getBytes(Charset.forName("CP852"));
        // The TypeScript receipt payload owns its top/bottom feeds so the footer stays
        // on the same receipt. Keep a single final full cut for RONGTA ESC/POS printers.
        byte[] finish = new byte[] { 0x1D, 0x56, 0x00 };
        // Send one ordered ESC/POS stream.  Separate USB transfers allowed a
        // long daily report to reach the cutter command before its final feed
        // had drained on some RP80 printers.
        byte[] payload = new byte[init.length + receipt.length + finish.length];
        System.arraycopy(init, 0, payload, 0, init.length);
        System.arraycopy(receipt, 0, payload, init.length, receipt.length);
        System.arraycopy(finish, 0, payload, init.length + receipt.length, finish.length);
        boolean ok = write(connection, output, payload);
        connection.releaseInterface(printerInterface);
        connection.close();
        if (!ok) { call.reject("Tiskárna nepřijala data účtenky."); return; }
        JSObject result = new JSObject(); result.put("printerName", printerName(device)); call.resolve(result);
    }

    private boolean write(UsbDeviceConnection connection, UsbEndpoint endpoint, byte[] data) { return connection.bulkTransfer(endpoint, data, data.length, 5000) == data.length; }
    private String printerName(UsbDevice device) { return device.getProductName() == null ? "RONGTA RP80-USE" : device.getProductName(); }
}
