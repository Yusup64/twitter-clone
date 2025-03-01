'use client';
import React, { useState } from 'react';
import { Form, Input, Button, Spacer, Link } from '@heroui/react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [submitted, setSubmitted] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    const newErrors: any = {};

    if (!formData.email) newErrors.email = 'Email or Mobile Number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    setErrors({});
    setSubmitted(formData);
    // Handle password reset logic here, such as API call
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <h1 className="text-center text-2xl font-bold">Forgot Password</h1>
      <p className="text-center text-gray-500">
        Don&apos;t worry! It happens. Please enter the email associated with
        your account.
      </p>

      {/* Forgot Password Form */}
      <Form
        aria-label="Forgot Password Form"
        className="space-y-4"
        validationErrors={errors}
        onReset={() => setErrors({})}
        onSubmit={handleSubmit}
      >
        {/* Email/Mobile Number Input */}
        <Input
          required
          className="max-w-full"
          errorMessage={errors.email}
          label="Email/Mobile Number"
          name="email"
          placeholder="Enter your email or mobile number"
          type="text"
          value={email}
          onValueChange={setEmail}
        />

        {/* Submit Button */}
        <Button className="w-full" color="primary" type="submit">
          Submit
        </Button>
      </Form>

      <Spacer y={2} />

      {/* Sign Up Link */}
      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link color="primary" href="/auth/login">
          Sign In
        </Link>
      </p>

      {/* Submitted Data */}
      {submitted && (
        <div className="text-small text-default-500 mt-4">
          Submitted data: <pre>{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
