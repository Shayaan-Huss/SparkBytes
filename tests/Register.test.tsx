import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAcc from '../app/createAcc/page';

describe('Register Page (CreateAcc)', () => {
  it('shows error when fields are empty', async () => {
    render(<CreateAcc />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email and password required/i)).toBeInTheDocument();
    });
  });

  it('shows success message when sign up is successful (no session)', async () => {
    render(<CreateAcc />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@bu.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'testpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please check your email to confirm registration/i)
      ).toBeInTheDocument();
    });
  });
});
