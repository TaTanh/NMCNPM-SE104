function normalizeHocKy(maHocKy) {
    if (!maHocKy && maHocKy !== 0) return maHocKy;

    const val = String(maHocKy).trim();
    if (val === '1') return 'HK1';
    if (val === '2') return 'HK2';
    // Also accept lowercase hk1/hk2
    if (val.toUpperCase().startsWith('HK')) return val.toUpperCase();
    return val;
}

module.exports = { normalizeHocKy };