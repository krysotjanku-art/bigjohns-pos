package cz.bigjohns.pos;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(UsbEscPosPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
