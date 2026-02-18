/* ══════════════════════════════════════════════════════════
   AetherIDE — ZIP Export (Pure JS, no dependencies)
   Minimal ZIP file generator using Deflate-free stored method
   ══════════════════════════════════════════════════════════ */

const ZipExport = {

    create() {
        return new ZipBuilder();
    },
};

class ZipBuilder {

    constructor() {
        this.files = [];
    }

    addFile(path, content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        this.files.push({ path, data });
    }

    download(filename) {
        const blob = this._build();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'project.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    _build() {
        const localHeaders = [];
        const centralHeaders = [];
        let offset = 0;

        for (const file of this.files) {
            const pathBytes = new TextEncoder().encode(file.path);
            const crc = this._crc32(file.data);
            const size = file.data.length;

            // Local file header (30 + pathLen + dataLen)
            const local = new ArrayBuffer(30 + pathBytes.length + size);
            const lv = new DataView(local);
            const lu = new Uint8Array(local);

            // Signature
            lv.setUint32(0, 0x04034b50, true);
            // Version needed
            lv.setUint16(4, 20, true);
            // Flags
            lv.setUint16(6, 0, true);
            // Compression (0 = stored)
            lv.setUint16(8, 0, true);
            // Mod time
            lv.setUint16(10, this._dosTime(), true);
            // Mod date
            lv.setUint16(12, this._dosDate(), true);
            // CRC-32
            lv.setUint32(14, crc, true);
            // Compressed size
            lv.setUint32(18, size, true);
            // Uncompressed size
            lv.setUint32(22, size, true);
            // Filename length
            lv.setUint16(26, pathBytes.length, true);
            // Extra field length
            lv.setUint16(28, 0, true);
            // Filename
            lu.set(pathBytes, 30);
            // File data
            lu.set(file.data, 30 + pathBytes.length);

            localHeaders.push(lu);

            // Central directory header (46 + pathLen)
            const central = new ArrayBuffer(46 + pathBytes.length);
            const cv = new DataView(central);
            const cu = new Uint8Array(central);

            // Signature
            cv.setUint32(0, 0x02014b50, true);
            // Version made by
            cv.setUint16(4, 20, true);
            // Version needed
            cv.setUint16(6, 20, true);
            // Flags
            cv.setUint16(8, 0, true);
            // Compression
            cv.setUint16(10, 0, true);
            // Mod time
            cv.setUint16(12, this._dosTime(), true);
            // Mod date
            cv.setUint16(14, this._dosDate(), true);
            // CRC-32
            cv.setUint32(16, crc, true);
            // Compressed size
            cv.setUint32(20, size, true);
            // Uncompressed size
            cv.setUint32(24, size, true);
            // Filename length
            cv.setUint16(28, pathBytes.length, true);
            // Extra field length
            cv.setUint16(30, 0, true);
            // Comment length
            cv.setUint16(32, 0, true);
            // Disk number start
            cv.setUint16(34, 0, true);
            // Internal attrs
            cv.setUint16(36, 0, true);
            // External attrs
            cv.setUint32(38, 0, true);
            // Local header offset
            cv.setUint32(42, offset, true);
            // Filename
            cu.set(pathBytes, 46);

            centralHeaders.push(cu);
            offset += local.byteLength;
        }

        const centralOffset = offset;
        let centralSize = 0;
        for (const ch of centralHeaders) centralSize += ch.length;

        // End of central directory (22 bytes)
        const eocd = new ArrayBuffer(22);
        const ev = new DataView(eocd);

        // Signature
        ev.setUint32(0, 0x06054b50, true);
        // Disk number
        ev.setUint16(4, 0, true);
        // Central dir disk
        ev.setUint16(6, 0, true);
        // Entries on disk
        ev.setUint16(8, this.files.length, true);
        // Total entries
        ev.setUint16(10, this.files.length, true);
        // Central dir size
        ev.setUint32(12, centralSize, true);
        // Central dir offset
        ev.setUint32(16, centralOffset, true);
        // Comment length
        ev.setUint16(20, 0, true);

        // Combine all parts
        const parts = [...localHeaders, ...centralHeaders, new Uint8Array(eocd)];
        return new Blob(parts, { type: 'application/zip' });
    }

    _crc32(data) {
        // CRC-32 lookup table (lazily generated)
        if (!ZipBuilder._crcTable) {
            const table = new Uint32Array(256);
            for (let i = 0; i < 256; i++) {
                let c = i;
                for (let j = 0; j < 8; j++) {
                    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                }
                table[i] = c;
            }
            ZipBuilder._crcTable = table;
        }

        const table = ZipBuilder._crcTable;
        let crc = 0xFFFFFFFF;

        for (let i = 0; i < data.length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    _dosTime() {
        const d = new Date();
        return ((d.getSeconds() >> 1) | (d.getMinutes() << 5) | (d.getHours() << 11));
    }

    _dosDate() {
        const d = new Date();
        return (d.getDate() | ((d.getMonth() + 1) << 5) | ((d.getFullYear() - 1980) << 9));
    }
}