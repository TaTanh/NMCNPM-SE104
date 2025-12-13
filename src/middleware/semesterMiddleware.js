const { normalizeHocKy } = require('../utils/semesterUtil');

const normalizeHocKyMiddleware = (req, res, next) => {
    try {
        if (req.query && req.query.maHocKy) {
            req.query.maHocKy = normalizeHocKy(req.query.maHocKy);
        }

        if (req.body) {
            if (req.body.maHocKy) {
                req.body.maHocKy = normalizeHocKy(req.body.maHocKy);
            }

            if (Array.isArray(req.body.giangDayList)) {
                req.body.giangDayList = req.body.giangDayList.map(a => ({
                    ...a,
                    maHocKy: typeof a.maHocKy !== 'undefined' ? normalizeHocKy(a.maHocKy) : a.maHocKy
                }));
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { normalizeHocKyMiddleware };
