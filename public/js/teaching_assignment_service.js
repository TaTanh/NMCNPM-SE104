/**
 * Teaching Assignment Service
 * Handles API calls for fetching and saving teaching assignments
 */

const TeachingAssignmentService = {
    /**
     * Fetch filter data (years, semesters, grades)
     */
    async getFilterData() {
        try {
            const [yearsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
                fetch('/api/settings/school-years'),
                fetch('/api/classes'),
                fetch('/api/subjects'),
                fetch('/api/auth/users?role=teacher')
            ]);

            const years = (await yearsRes.json()) || [];
            const classes = (await classesRes.json()) || [];
            const subjects = (await subjectsRes.json()) || [];
            const teachers = (await teachersRes.json()).filter(t => {
                const role = (t.mavaitro || t.MaVaiTro || '').toUpperCase();
                return role === 'GVBM' || role === 'GVCN' || role.includes('GIÁO');
            }) || [];

            // Extract unique grades from classes
            const grades = [...new Set(classes.map(c => c.makhoi || c.MaKhoiLop || '').filter(Boolean))].sort();

            return {
                years,
                semesters: [
                    { id: 'HK1', name: 'Học kỳ 1' },
                    { id: 'HK2', name: 'Học kỳ 2' }
                ],
                grades,
                subjects,
                teachers,
                classes
            };
        } catch (error) {
            console.error('Error fetching filter data:', error);
            throw error;
        }
    },

    /**
     * Fetch teaching assignments for a given year, semester, and grade
     * Returns aggregated data ready to render the table
     */
    async getAssignments(yearId, semesterId, grade) {
        try {
            const params = new URLSearchParams();
            if (yearId) params.append('maNamHoc', yearId);
            if (semesterId) params.append('maHocKy', semesterId);
            if (grade) params.append('maKhoiLop', grade);

            const response = await fetch(`/api/teaching-assignments?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching assignments:', error);
            throw error;
        }
    },

    /**
     * Save teaching assignment for a single class
     * Payload: { classId, homeroomTeacherId, subjectTeacherMap: { [subjectId]: teacherId | null } }
     */
    async saveAssignments(classId, homeroomTeacherId, subjectTeacherMap, yearId, semesterId) {
        try {
            const user = getCurrentUser();
            const payload = {
                maLop: classId,
                maGVCN: homeroomTeacherId,
                assignments: Object.entries(subjectTeacherMap).map(([subjectId, teacherId]) => ({
                    maMonHoc: subjectId,
                    maGiaoVien: teacherId
                })),
                maNamHoc: yearId,
                maHocKy: semesterId
            };

            const response = await fetch('/api/teaching-assignments', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.maNguoiDung || ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error saving assignments:', error);
            throw error;
        }
    },

    /**
     * Update a single subject-teacher assignment for a class
     */
    async updateSubjectTeacher(classId, subjectId, teacherId, yearId, semesterId) {
        try {
            const user = getCurrentUser();
            const response = await fetch('/api/giangday', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.maNguoiDung || ''
                },
                body: JSON.stringify({
                    maLop: classId,
                    maMonHoc: subjectId,
                    maGiaoVien: teacherId,
                    maHocKy: semesterId,
                    maNamHoc: yearId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating subject teacher:', error);
            throw error;
        }
    },

    /**
     * Update homeroom teacher (GVCN) for a class
     */
    async updateHomeroomTeacher(classId, teacherId) {
        try {
            const user = getCurrentUser();
            const response = await fetch(`/api/classes/${classId}/gvcn`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.maNguoiDung || ''
                },
                body: JSON.stringify({
                    maGVCN: teacherId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating homeroom teacher:', error);
            throw error;
        }
    }
};
