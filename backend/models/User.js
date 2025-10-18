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

      console.log('📝 Creating user with data:', { name, email, role });

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // FIX: Check if OTP columns exist in your database first
      // For now, let's use a safe INSERT without OTP columns
      const result = await db.executeQuery(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
        [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
      );

      console.log('📝 User creation result:', result);

      // FIX: Handle the result properly
      if (!result) {
        throw new Error('Database query returned undefined result');
      }

      let user;
      if (Array.isArray(result) && result.length > 0) {
        user = result[0];
      } else if (result && result.id) {
        user = result;
      } else {
        throw new Error('Failed to create user: No valid ID returned from database');
      }

      console.log('✅ User created successfully with ID:', user.id);

      // Return user data without password
      return { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        is_verified: false 
      };
    } catch (error) {
      console.error('❌ User creation error:', error);
      
      // Handle duplicate email error (PostgreSQL error code)
      if (error.code === '23505') {
        throw new Error('User already exists with this email');
      }
      
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );
      return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
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
      // First check if is_verified column exists
      const result = await db.executeQuery(
        'UPDATE users SET is_verified = TRUE WHERE id = $1 RETURNING id',
        [userId]
      );
      
      if (!result || (Array.isArray(result) && result.length === 0)) {
        throw new Error('User not found or update failed');
      }
      
      return true;
    } catch (error) {
      console.error('Update verification error:', error);
      // If column doesn't exist, just return true (skip verification for now)
      if (error.code === '42703') { // undefined column
        console.log('⚠️  is_verified column not found, skipping verification');
        return true;
      }
      throw error;
    }
  }

  // OTP-related methods - COMMENTED OUT until we add the columns to database
  /*
  static async setOTP(userId, otp, expiryMinutes = 10) {
    try {
      const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
      await db.executeQuery(
        'UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3',
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
        'SELECT otp, otp_expiry FROM users WHERE id = $1',
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
        'UPDATE users SET otp = NULL, otp_expiry = NULL, is_verified = TRUE WHERE id = $1',
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
        'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = $1',
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
        'SELECT otp, otp_expiry FROM users WHERE id = $1',
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
  */

  // Test method to check database connection
  static async testConnection() {
    try {
      const result = await db.executeQuery('SELECT 1 as test');
      return (Array.isArray(result) && result.length > 0) ? result[0].test === 1 : false;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

module.exports = User;
