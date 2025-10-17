const db = require('./config/database');

async function addOTPFields() {
  try {
    console.log('🔄 Adding OTP fields to users table...');
    
    // Add OTP and OTP expiry columns to users table
    await db.executeQuery(`
      ALTER TABLE users 
      ADD COLUMN otp VARCHAR(6) NULL,
      ADD COLUMN otp_expiry DATETIME NULL
    `);
    
    console.log('✅ OTP fields added successfully to users table');
    
    // Verify the changes
    const result = await db.executeQuery(`
      DESCRIBE users
    `);
    
    console.log('📊 Users table structure:');
    result.forEach(column => {
      console.log(`   ${column.Field} - ${column.Type}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding OTP fields:', error.message);
    
    // If columns already exist, that's fine
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ OTP fields already exist in users table');
    } else {
      throw error;
    }
  }
}

// Run the function
addOTPFields()
  .then(() => {
    console.log('✨ OTP fields setup completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 OTP fields setup failed:', error);
    process.exit(1);
  });