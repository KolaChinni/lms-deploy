const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      const { name, email, password, role } = userData;
      
      // Validate required fields
      if (!name || !email || !password || !role) {
        throw new Error('All fields are required');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await db.executeQuery(
        'INSERT INTO users (name, email, password, role, is_verified, otp, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), hashedPassword, role, false, null, null]
      );

      // Return user data without password
      return { 
        id: result.insertId, 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        role, 
        is_verified: false 
      };
    } catch (error) {
      console.error('User creation error:', error);
      
      // Handle duplicate email error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User already exists with this email');
      }
      
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT id, name, email, role, is_verified, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Find user by ID error:', error);
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      throw error;
    }
  }

  static async updateVerification(userId) {
    try {
      await db.executeQuery(
        'UPDATE users SET is_verified = TRUE WHERE id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Update verification error:', error);
      throw error;
    }
  }

  // OTP-related methods
  static async setOTP(userId, otp, expiryMinutes = 10) {
    try {
      const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
      await db.executeQuery(
        'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
        [otp, otpExpiry, userId]
      );
      return true;
    } catch (error) {
      console.error('Set OTP error:', error);
      throw error;
    }
  }

  static async verifyOTP(userId, otp) {
    try {
      const user = await db.executeQuery(
        'SELECT otp, otp_expiry FROM users WHERE id = ?',
        [userId]
      );
      
      if (!user[0]) {
        throw new Error('User not found');
      }

      const { otp: storedOTP, otp_expiry } = user[0];
      
      // Check if OTP exists and is not expired
      if (!storedOTP || !otp_expiry) {
        throw new Error('OTP not found or expired');
      }

      if (new Date() > new Date(otp_expiry)) {
        throw new Error('OTP has expired');
      }

      if (storedOTP !== otp.toString()) {
        throw new Error('Invalid OTP');
      }

      // Clear OTP after successful verification
      await db.executeQuery(
        'UPDATE users SET otp = NULL, otp_expiry = NULL, is_verified = TRUE WHERE id = ?',
        [userId]
      );

      return true;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  static async clearOTP(userId) {
    try {
      await db.executeQuery(
        'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Clear OTP error:', error);
      throw error;
    }
  }

  static async isOTPValid(userId) {
    try {
      const user = await db.executeQuery(
        'SELECT otp, otp_expiry FROM users WHERE id = ?',
        [userId]
      );
      
      if (!user[0] || !user[0].otp || !user[0].otp_expiry) {
        return false;
      }

      return new Date() < new Date(user[0].otp_expiry);
    } catch (error) {
      console.error('Check OTP validity error:', error);
      return false;
    }
  }

  // Test method to check database connection
  static async testConnection() {
    try {
      const result = await db.executeQuery('SELECT 1 as test');
      return result[0].test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

module.exports = User;