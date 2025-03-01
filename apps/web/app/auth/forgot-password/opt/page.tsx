'use client';
import React, { useState } from 'react';
import { Input, Button, Link } from '@heroui/react';

const OTPPage = () => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [errors, setErrors] = useState<string>('');

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return; // Allow only digits
    const newOtp = [...otp];

    newOtp[index] = value;
    setOtp(newOtp);

    // Automatically move to the next input
    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);

      nextInput?.focus();
    }
  };

  const handleSubmit = () => {
    if (otp.some((digit) => digit === '')) {
      setErrors('Please fill out all OTP fields.');

      return;
    }

    setErrors('');
    const otpCode = otp.join('');

    console.log('OTP Code Submitted:', otpCode);

    // Add your OTP verification logic here
  };

  const handleReset = () => {
    setOtp(['', '', '', '']);
    setErrors('');
    document.getElementById('otp-input-0')?.focus();
  };

  return (
    <div className="w-full max-w-md space-y-8 mx-auto">
      <h1 className="text-center text-2xl font-bold">Enter OTP Code</h1>
      <p className="text-center text-gray-500">
        A 4-digit code has been sent to{' '}
        <Link color="primary" href="mailto:mukhlisin@gmail.com">
          mukhlisin@gmail.com
        </Link>
      </p>

      {/* OTP Inputs */}
      <div className="flex justify-center space-x-2">
        {otp.map((value, index) => (
          <Input
            key={index}
            className="w-12 h-12 text-center text-xl"
            id={`otp-input-${index}`}
            maxLength={1}
            placeholder="-"
            type="text"
            value={value}
            onValueChange={(e) => handleChange(e, index)}
          />
        ))}
      </div>
      {errors && <p className="text-center text-red-500">{errors}</p>}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6 gap-4">
        <Button
          className="flex-1"
          color="default"
          variant="bordered"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button className="flex-1" color="primary" onClick={handleSubmit}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OTPPage;
