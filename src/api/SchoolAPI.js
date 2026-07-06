import { powerSync } from './PowerSyncConnector';
import { base44 } from './base44Client';

class SchoolAPI {
  // ==================== STUDENTS ====================
  
  async getStudents(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT * FROM school_students WHERE company_id = ? ORDER BY name ASC',
        [companyId]
      );
      return result.rows._array || [];
    } catch (error) {
      console.error('[SchoolAPI] Get students error:', error);
      throw new Error('Failed to fetch students');
    }
  }

  async getStudentsByClass(companyId, className) {
    try {
      const result = await powerSync.execute(
        'SELECT * FROM school_students WHERE company_id = ? AND class = ? ORDER BY name ASC',
        [companyId, className]
      );
      return result.rows._array || [];
    } catch (error) {
      console.error('[SchoolAPI] Get students by class error:', error);
      throw new Error('Failed to fetch students');
    }
  }

  async addStudent(companyId, studentData, userId) {
    try {
      // First create via base44
      const created = await base44.entities.Client.create({
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone,
        type: 'student',
        company_id: companyId,
        created_by: userId,
        created_at: new Date().toISOString()
      });

      // Then add to school_students table
      await powerSync.execute(
        'INSERT INTO school_students (id, company_id, name, email, phone, class, status, enrollment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          created.id,
          companyId,
          studentData.name,
          studentData.email,
          studentData.phone,
          studentData.class || '',
          'Active',
          studentData.enrollmentDate || new Date().toISOString().split('T')[0]
        ]
      );

      return created;
    } catch (error) {
      console.error('[SchoolAPI] Add student error:', error);
      throw new Error('Failed to add student');
    }
  }

  async updateStudent(companyId, studentId, studentData, userId) {
    try {
      await base44.entities.Client.update(studentId, {
        ...studentData,
        updated_by: userId,
        updated_at: new Date().toISOString()
      });

      await powerSync.execute(
        'UPDATE school_students SET name = ?, email = ?, phone = ?, class = ?, status = ? WHERE id = ?',
        [
          studentData.name,
          studentData.email,
          studentData.phone,
          studentData.class,
          studentData.status,
          studentId
        ]
      );

      return true;
    } catch (error) {
      console.error('[SchoolAPI] Update student error:', error);
      throw new Error('Failed to update student');
    }
  }

  async deleteStudent(companyId, studentId, userId) {
    try {
      await base44.entities.Client.delete(studentId);
      await powerSync.execute('DELETE FROM school_students WHERE id = ?', [studentId]);
      return true;
    } catch (error) {
      console.error('[SchoolAPI] Delete student error:', error);
      throw new Error('Failed to delete student');
    }
  }

  // ==================== PARENTS ====================

  async getParents(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT * FROM school_parents WHERE company_id = ? ORDER BY name ASC',
        [companyId]
      );
      return result.rows._array || [];
    } catch (error) {
      console.error('[SchoolAPI] Get parents error:', error);
      throw new Error('Failed to fetch parents');
    }
  }

  async addParent(companyId, parentData, userId) {
    try {
      const created = await base44.entities.Client.create({
        name: parentData.name,
        email: parentData.email,
        phone: parentData.phone,
        type: 'parent',
        company_id: companyId,
        created_by: userId,
        created_at: new Date().toISOString()
      });

      await powerSync.execute(
        'INSERT INTO school_parents (id, company_id, name, email, phone, relationship, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          created.id,
          companyId,
          parentData.name,
          parentData.email,
          parentData.phone,
          parentData.relationship || 'Parent',
          parentData.studentId || null
        ]
      );

      return created;
    } catch (error) {
      console.error('[SchoolAPI] Add parent error:', error);
      throw new Error('Failed to add parent');
    }
  }

  async updateParent(companyId, parentId, parentData, userId) {
    try {
      await base44.entities.Client.update(parentId, {
        ...parentData,
        updated_by: userId,
        updated_at: new Date().toISOString()
      });

      await powerSync.execute(
        'UPDATE school_parents SET name = ?, email = ?, phone = ?, relationship = ?, student_id = ? WHERE id = ?',
        [
          parentData.name,
          parentData.email,
          parentData.phone,
          parentData.relationship,
          parentData.studentId,
          parentId
        ]
      );

      return true;
    } catch (error) {
      console.error('[SchoolAPI] Update parent error:', error);
      throw new Error('Failed to update parent');
    }
  }

  async deleteParent(companyId, parentId, userId) {
    try {
      await base44.entities.Client.delete(parentId);
      await powerSync.execute('DELETE FROM school_parents WHERE id = ?', [parentId]);
      return true;
    } catch (error) {
      console.error('[SchoolAPI] Delete parent error:', error);
      throw new Error('Failed to delete parent');
    }
  }

  // ==================== CLASSES ====================

  async getClasses(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT * FROM school_classes WHERE company_id = ? ORDER BY name ASC',
        [companyId]
      );
      return result.rows._array || [];
    } catch (error) {
      console.error('[SchoolAPI] Get classes error:', error);
      throw new Error('Failed to fetch classes');
    }
  }

  async addClass(companyId, classData, userId) {
    try {
      const id = `class_${Date.now()}`;
      await powerSync.execute(
        'INSERT INTO school_classes (id, company_id, name, level, teacher, capacity) VALUES (?, ?, ?, ?, ?, ?)',
        [id, companyId, classData.name, classData.level || '', classData.teacher || '', classData.capacity || 50]
      );
      return { id, ...classData };
    } catch (error) {
      console.error('[SchoolAPI] Add class error:', error);
      throw new Error('Failed to add class');
    }
  }

  async updateClass(companyId, classId, classData, userId) {
    try {
      await powerSync.execute(
        'UPDATE school_classes SET name = ?, level = ?, teacher = ?, capacity = ? WHERE id = ?',
        [classData.name, classData.level, classData.teacher, classData.capacity, classId]
      );
      return true;
    } catch (error) {
      console.error('[SchoolAPI] Update class error:', error);
      throw new Error('Failed to update class');
    }
  }

  async deleteClass(companyId, classId, userId) {
    try {
      await powerSync.execute('DELETE FROM school_classes WHERE id = ?', [classId]);
      return true;
    } catch (error) {
      console.error('[SchoolAPI] Delete class error:', error);
      throw new Error('Failed to delete class');
    }
  }

  // ==================== STATISTICS ====================

  async getStudentStats(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = "Active" THEN 1 ELSE 0 END) as active FROM school_students WHERE company_id = ?',
        [companyId]
      );
      return result.rows._array?.[0] || { total: 0, active: 0 };
    } catch (error) {
      console.error('[SchoolAPI] Get student stats error:', error);
      return { total: 0, active: 0 };
    }
  }

  async getClassStats(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT COUNT(*) as total FROM school_classes WHERE company_id = ?',
        [companyId]
      );
      return result.rows._array?.[0]?.total || 0;
    } catch (error) {
      console.error('[SchoolAPI] Get class stats error:', error);
      return 0;
    }
  }

  async getParentStats(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT COUNT(*) as total FROM school_parents WHERE company_id = ?',
        [companyId]
      );
      return result.rows._array?.[0]?.total || 0;
    } catch (error) {
      console.error('[SchoolAPI] Get parent stats error:', error);
      return 0;
    }
  }
}

export default new SchoolAPI();
