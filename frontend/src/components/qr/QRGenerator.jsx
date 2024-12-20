// src/components/qr/QRGenerator.jsx
import React, { useState, useRef } from 'react';
import {
    MDBTextArea,
    MDBBtn,
    MDBInput,
    MDBSelect,
    MDBCheckbox
} from 'mdb-react-ui-kit';
import { QRCodeSVG } from 'qrcode.react';

const QRGenerator = () => {
    const [format, setFormat] = useState('text');
    const [qrData, setQrData] = useState('');
    const [wifiConfig, setWifiConfig] = useState({
        ssid: '',
        password: '',
        authentication: 'WPA',
        hidden: false
    });
    const [showQR, setShowQR] = useState(false);
    const qrRef = useRef(null);

    const handleGenerate = () => {
        const data = format === 'text' ? qrData :
            `WIFI:T:${wifiConfig.authentication};S:${wifiConfig.ssid};P:${wifiConfig.password};H:${wifiConfig.hidden};`;
        setShowQR(true);
    };

    const handleDownload = () => {
        if (!qrRef.current) return;
        
        // Get SVG element
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;
        
        // Convert SVG to string
        const svgData = new XMLSerializer().serializeToString(svg);
        
        // Create blob from SVG
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        
        // Create URL from blob
        const url = URL.createObjectURL(svgBlob);
        
        // Create temp link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printContent = qrRef.current.innerHTML;
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        document.body.appendChild(frame);
        frame.contentDocument.write(`
      <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { max-width: 100%; height: auto; }
      </style>
      ${printContent}
    `);
        frame.contentWindow.print();
        document.body.removeChild(frame);
    };

    const handleSelect = (event) => {
        // Only process if we have a valid value
        if (event && typeof event === 'object' && 'value' in event) {
            console.log('Format changed to:', event.value);
            setFormat(event.value);
            setQrData('');
            setShowQR(false);
            if (event.value === 'wifi') {
                setWifiConfig({
                    ssid: '',
                    password: '',
                    authentication: 'WPA',
                    hidden: false
                });
            }
        }
    };

    return (
        <div className="container-fluid">
            <h2>QR Generator</h2>
            <section>
                <MDBSelect
                    data={[
                        { text: 'Plain Text', value: 'text' },
                        { text: 'WiFi Configuration', value: 'wifi' }
                    ]}
                    value={format}
                    onChange={handleSelect}
                    label="Format"
                />

                {format === 'text' && (
                    <div className="form-outline mt-2">
                        <MDBTextArea
                            id='qr-data'
                            rows={4}
                            value={qrData}
                            onChange={(e) => setQrData(e.target.value)}
                            label='Message'
                        />
                    </div>
                )}

                {format === 'wifi' && (
                    <div className="mt-2">
                        <MDBInput
                            label='SSID (Network Name)'
                            value={wifiConfig.ssid}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })}
                        />
                        <MDBInput
                            type='password'
                            label='Password'
                            className='mt-2'
                            value={wifiConfig.password}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })}
                        />
                        <MDBSelect
                            data={[
                                { text: 'WPA/WPA2/WPA3', value: 'WPA' },
                                { text: 'WEP', value: 'WEP' },
                                { text: 'None', value: 'nopass' }
                            ]}
                            value={wifiConfig.authentication}
                            onChange={(value) => setWifiConfig({ ...wifiConfig, authentication: value })}
                            label="Security"
                            className='mt-2'
                        />
                        <MDBCheckbox
                            label='Hidden Network'
                            checked={wifiConfig.hidden}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, hidden: e.target.checked })}
                        />
                    </div>
                )}

                <div className="mt-3">
                    <MDBBtn onClick={handleGenerate} className='me-2'>Generate</MDBBtn>
                    {showQR && (
                        <>
                            <MDBBtn onClick={handleDownload} className='me-2'>Download</MDBBtn>
                            <MDBBtn onClick={handlePrint}>Print</MDBBtn>
                        </>
                    )}
                </div>

                <div id="qrcode" ref={qrRef} className="mt-3">
                    {showQR && (
                        <QRCodeSVG // Changed component name
                            value={format === 'text' ? qrData :
                                `WIFI:T:${wifiConfig.authentication};S:${wifiConfig.ssid};P:${wifiConfig.password};H:${wifiConfig.hidden};`}
                            size={256}
                            level="M"
                            includeMargin={true}
                        />
                    )}
                </div>
            </section>
        </div>
    );
};

export default QRGenerator;