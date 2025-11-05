'use client';
import { useState } from "react";
import jsSHA from "jssha";

export default function Home() {
  const [listToken, setListToken] = useState("");
  const [output, setOutput] = useState("");

  // Thêm log
  const addLogs = (txt: string) => {
    setOutput((prev) => (prev ? prev + "\n" + txt : txt));
  };

  // Xóa log
  const cleanLogs = () => setOutput("");

  // --- Sinh TOTP ---
  const generateTOTP = (secret: string) => {
    const shaObj = new jsSHA("SHA-1", "BYTES");
    const epoch = Math.floor(new Date().getTime() / 1000.0);
    let time = Math.floor(epoch / 30);

    const timeBytes = [];
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = time & 0xff;
      time >>= 8;
    }

    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    secret = secret.replace(/=+$/, "").toUpperCase();
    for (let i = 0; i < secret.length; i++) {
      const val = base32chars.indexOf(secret.charAt(i));
      bits += val.toString(2).padStart(5, "0");
    }

    const keyBytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      keyBytes.push(parseInt(bits.substr(i, 8), 2));
    }

    const keyStr = String.fromCharCode.apply(null, keyBytes);
    shaObj.setHMACKey(keyStr, "BYTES");
    shaObj.update(String.fromCharCode.apply(null, timeBytes));
    const hmac = shaObj.getHMAC("BYTES");

    const offset = hmac.charCodeAt(hmac.length - 1) & 0xf;
    let code =
      ((hmac.charCodeAt(offset) & 0x7f) << 24) |
      ((hmac.charCodeAt(offset + 1) & 0xff) << 16) |
      ((hmac.charCodeAt(offset + 2) & 0xff) << 8) |
      (hmac.charCodeAt(offset + 3) & 0xff);

    code = code % 1000000;
    return code.toString().padStart(6, "0");
  };

  // Khi bấm "Generate Code"
  const handleGenerate = () => {
    cleanLogs();
    const secrets = listToken.trim().split("\n");
    secrets.forEach((secret) => {
      if (secret.trim()) {
        const code = generateTOTP(secret.replace(/\s/g, ""));
        addLogs(`${secret}|${code}`);
      }
    });
  };

  // Copy toàn bộ
  const copyAll = () => {
    if (!output.trim()) return alert("No content to copy.");
    navigator.clipboard.writeText(output);
  };

  // Copy chỉ mã 2FA
  const copyCodes = () => {
    const lines = output.trim().split("\n");
    const codes = lines.map((l) => l.split("|").pop()).join("\n");
    if (!codes.trim()) return alert("No 2FA codes to copy.");
    navigator.clipboard.writeText(codes);
  };
  return (
    <>
      <div className="">
        <header>
          <h2>🔐 2FA Authenticator</h2>
          <p>Generate 2FA codes easily — store your secret safely</p>
        </header>

        <div className="container" style={{ maxWidth: '700px', marginTop: '40px' }}>
          <div className="mb-3" style={{ marginBottom: '20px' }}>
            <label htmlFor="listToken" className="form-label"><b>* 2FA Secret</b></label>
            <textarea className="form-control" id="listToken" placeholder="BK5VTWQ7D2RB..." rows={5} value={listToken} onChange={(e) => setListToken(e.target.value)}></textarea>
          </div>

          <div className="mb-3" style={{ marginBottom: '20px' }}>
            <button className="btn btn-primary" id="submit" onClick={handleGenerate}>Generate Code</button>
          </div>

          <div className="mb-3" style={{ marginBottom: '20px' }}>
            <label htmlFor="output" className="form-label"><b>* 2FA Code</b></label>
            <textarea className="form-control" id="output" placeholder="ABC|2FA Code" rows={5} readOnly value={output}></textarea>
          </div>

          <div className="copy-buttons-container">
            <button className="btn btn-success" id="copy_btn" onClick={copyAll}>Copy All</button>
            <button className="btn btn-info" id="copy_2fa_btn" onClick={copyCodes}>Copy Codes</button>
          </div>
        </div>

        <footer>
          <p>© 2025 2FA Auth Tool — Made with ❤️</p>
        </footer>
      </div>
    </>

  );
}
