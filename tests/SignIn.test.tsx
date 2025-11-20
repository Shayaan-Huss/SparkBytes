import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Signin from '../app/signin/page'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}))

describe('Signin Page', () => {
  const push = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push })
  })

  it('renders the sign in form', () => {
    render(<Signin />)
    expect(screen.getByPlaceholderText('BU email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows alert if fields are empty', () => {
    window.alert = jest.fn()
    render(<Signin />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(window.alert).toHaveBeenCalledWith('Please enter your email and password.')
  })

  it('shows alert if email is not a BU email', () => {
    window.alert = jest.fn()
    render(<Signin />)
    fireEvent.change(screen.getByPlaceholderText('BU email'), {
      target: { value: 'user@gmail.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'testpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(window.alert).toHaveBeenCalledWith('Please use your BU email (@bu.edu)')
  })

  it('signs in successfully and redirects', async () => {
    window.alert = jest.fn()
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null })

    render(<Signin />)

    fireEvent.change(screen.getByPlaceholderText('BU email'), {
      target: { value: 'test@bu.edu' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'validpassword' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Sign in successful!')
      expect(push).toHaveBeenCalledWith('/')
    })
  })

  it('shows error if Supabase returns an error', async () => {
    window.alert = jest.fn()
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: { message: 'Invalid credentials' },
    })

    render(<Signin />)

    fireEvent.change(screen.getByPlaceholderText('BU email'), {
      target: { value: 'test@bu.edu' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid credentials')
      expect(push).not.toHaveBeenCalled()
    })
  })
})
