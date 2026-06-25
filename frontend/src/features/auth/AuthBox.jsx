import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signupUser, resetPassword } from '../../auth/firebase';

const AuthBox = () => {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('VOLUNTEER');
    const [message, setMessage] = useState('');
    const [showLoginPwd, setShowLoginPwd] = useState(false);
    const [showSignupPwd, setShowSignupPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Processing...');

        try {
            if (isLogin) {
                const token = await loginUser(email, password);
                localStorage.setItem("token", token);
                setMessage('loading...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.role === 'NGO') navigate('/ngo-dashboard');
                    else if (data.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
                    else setMessage('Error: Unknown user role.');
                } else {
                    setMessage(`Django Error: ${data.error}`);
                }

            } else {
                if (password !== confirmPassword) {
                    setMessage("Error: Passwords do not match!");
                    return;
                }
                const token = await signupUser(email, password);
                setMessage('Firebase account created! loading...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, name, role }),
                });

                const data = await response.json();

                if (response.ok) {
                    setMessage('Signup successful! Please log in to continue.');
                    setIsLogin(true);
                    setPassword('');
                    setConfirmPassword('');
                } else {
                    setMessage(`Django Error: ${data.error}`);
                }
            }

        } catch (error) {
            console.error(error);
            setMessage(`Firebase Error: ${error.message}`);
        }
    };

    const toggleMode = (mode) => {
        setIsLogin(mode);
        setMessage('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setMessage("Please enter your email first to reset password.");
            return;
        }
        try {
            const msg = await resetPassword(email);
            setMessage(msg);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="login-wrapper">
            <div className={`login-box ${!isLogin ? 'signup-mode' : ''}`} id="loginBox">
                {/* Sliding Panel */}
                <div className="login-panel">
                    <div className="panel-content panel-signin">
                        <h3>Welcome Back!</h3>
                        <p>Stay connected — login to continue making a difference.</p>
                        <button className="toggle-btn" onClick={() => toggleMode(false)}>Sign Up</button>
                    </div>
                    <div className="panel-content panel-signup">
                        <h3>Hello, Friend!</h3>
                        <p>Join us and start your journey of impact today.</p>
                        <button className="toggle-btn" onClick={() => toggleMode(true)}>Sign In</button>
                    </div>
                </div>

                {/* Form Panel */}
                <div className="form-panel">
                    {/* Sign In Form */}
                    <div className="form-content form-signin">
                        <h2>Sign In</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="inp-group">
                                <input type="email" placeholder="Email" value={email}
                                    onChange={(e) => setEmail(e.target.value)} required />
                                <i className="fas fa-envelope ico"></i>
                            </div>
                            <div className="inp-group">
                                <input type={showLoginPwd ? "text" : "password"} placeholder="Password" value={password}
                                    onChange={(e) => setPassword(e.target.value)} required />
                                <i className={`fas ${showLoginPwd ? "fa-eye-slash" : "fa-eye"} ico ico-toggle`}
                                    onClick={() => setShowLoginPwd((v) => !v)}
                                    role="button" aria-label="Toggle password visibility"></i>
                            </div>
                            <p className="forgot" onClick={handleForgotPassword}>Forgot Password?</p>
                            <button type="submit" className="sub-btn">Login</button>
                            {isLogin && message && <div className="message-box">{message}</div>}
                        </form>
                    </div>

                    {/* Sign Up Form */}
                    <div className="form-content form-signup">
                        <h2>Create Account</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="inp-group">
                                <input type="text" placeholder="Full Name" value={name}
                                    onChange={(e) => setName(e.target.value)} required={!isLogin} />
                                <i className="fas fa-user ico"></i>
                            </div>
                            <div className="inp-group">
                                <input type="email" placeholder="Email" value={email}
                                    onChange={(e) => setEmail(e.target.value)} required={!isLogin} />
                                <i className="fas fa-envelope ico"></i>
                            </div>
                            <div className="role-toggle">
                                <button type="button" className={role === 'VOLUNTEER' ? 'active' : ''}
                                    onClick={() => setRole('VOLUNTEER')}>
                                    <i className="fas fa-user-alt"></i> Volunteer
                                </button>
                                <button type="button" className={role === 'NGO' ? 'active' : ''}
                                    onClick={() => setRole('NGO')}>
                                    <i className="fas fa-building"></i> NGO
                                </button>
                            </div>
                            <div className="inp-group">
                                <input type={showSignupPwd ? "text" : "password"} placeholder="Password" value={password}
                                    onChange={(e) => setPassword(e.target.value)} required={!isLogin} />
                                <i className={`fas ${showSignupPwd ? "fa-eye-slash" : "fa-eye"} ico ico-toggle`}
                                    onClick={() => setShowSignupPwd((v) => !v)}
                                    role="button" aria-label="Toggle password visibility"></i>
                            </div>
                            <div className="inp-group">
                                <input type={showConfirmPwd ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} required={!isLogin} />
                                <i className={`fas ${showConfirmPwd ? "fa-eye-slash" : "fa-eye"} ico ico-toggle`}
                                    onClick={() => setShowConfirmPwd((v) => !v)}
                                    role="button" aria-label="Toggle password visibility"></i>
                            </div>
                            <button type="submit" className="sub-btn" style={{ marginTop: '6px' }}>Sign Up</button>
                            {!isLogin && message && <div className="message-box">{message}</div>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthBox;
