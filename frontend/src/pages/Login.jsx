import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signupUser, resetPassword } from '../services/auth';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    // UI State
    const [isLogin, setIsLogin] = useState(true);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('VOLUNTEER');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Processing...');

        try {
            let token = '';

            if (isLogin) {
                // --- LOGIN FLOW ---
                token = await loginUser(email, password);
                localStorage.setItem("token", token);
                setMessage('loading...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token })
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.role === 'NGO') {
                        navigate('/ngo-dashboard');
                    } else if (data.role === 'VOLUNTEER') {
                        navigate('/volunteer-dashboard');
                    } else {
                        setMessage('Error: Unknown user role.');
                    }
                } else {
                    setMessage(`Django Error: ${data.error}`);
                }

            } else {
                // --- SIGNUP FLOW ---

                // Password Validation
                if (password !== confirmPassword) {
                    setMessage("Error: Passwords do not match!");
                    return;
                }

                token = await signupUser(email, password);
                setMessage('Firebase account created! Syncing clocks...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: token,
                        name: name,
                        role: role
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setMessage('Signup successful! Please log in to continue.');
                    setIsLogin(true); // Slide back to login
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

    // Helper function to handle switching modes and clearing fields
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
        <div className="sevasync-landing">
            {/* NAVBAR */}
            <nav>
                <div className="nav-logo">
                    <div className="nav-logo-icon"><i className="fas fa-hands-helping"></i></div>
                    SévaSync
                </div>
                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#how">How It Works</a>
                    <a href="#about">About</a>
                    <a href="#loginBox" className="nav-cta">Get Started</a>
                </div>
            </nav>

            {/* HERO & LOGIN SECTION */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-left">
                        <div className="hero-badge">
                            <div className="hero-badge-dot"></div>
                            AI-Powered NGO Platform
                        </div>
                        <h1 className="hero-title">
                            Connecting<br />
                            <span>Communities</span><br />
                            with Care
                        </h1>
                        <p className="hero-desc">
                            SévaSync bridges local NGOs and skilled volunteers using AI. Upload community data, identify urgent needs instantly, and dispatch the right help — faster than ever before.
                        </p>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-num">2x</div>
                                <div className="stat-label">Faster Response</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-num">95%</div>
                                <div className="stat-label">Match Accuracy</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-num">500+</div>
                                <div className="stat-label">Lives Impacted</div>
                            </div>
                        </div>
                    </div>

                    {/* LOGIN BOX (Integrated) */}
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
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                            <i className="fas fa-envelope ico"></i>
                                        </div>
                                        <div className="inp-group">
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <i className="fas fa-lock ico"></i>
                                        </div>
                                        <p className="forgot" onClick={handleForgotPassword}>Forgot Password?</p>
                                        <button type="submit" className="sub-btn">Login</button>

                                        {isLogin && message && (
                                            <div className="message-box">{message}</div>
                                        )}
                                    </form>
                                </div>

                                {/* Sign Up Form */}
                                <div className="form-content form-signup">
                                    <h2>Create Account</h2>
                                    <form onSubmit={handleSubmit}>
                                        <div className="inp-group">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required={!isLogin}
                                            />
                                            <i className="fas fa-user ico"></i>
                                        </div>
                                        <div className="inp-group">
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required={!isLogin}
                                            />
                                            <i className="fas fa-envelope ico"></i>
                                        </div>
                                        <div className="role-toggle">
                                            <button
                                                type="button"
                                                className={role === 'VOLUNTEER' ? 'active' : ''}
                                                onClick={() => setRole('VOLUNTEER')}
                                            >
                                                <i className="fas fa-user-alt"></i> Volunteer
                                            </button>
                                            <button
                                                type="button"
                                                className={role === 'NGO' ? 'active' : ''}
                                                onClick={() => setRole('NGO')}
                                            >
                                                <i className="fas fa-building"></i> NGO
                                            </button>
                                        </div>
                                        <div className="inp-group">
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required={!isLogin}
                                            />
                                            <i className="fas fa-lock ico"></i>
                                        </div>
                                        <div className="inp-group">
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required={!isLogin}
                                            />
                                            <i className="fas fa-lock ico"></i>
                                        </div>
                                        <button type="submit" className="sub-btn" style={{ marginTop: '6px' }}>Sign Up</button>

                                        {!isLogin && message && (
                                            <div className="message-box">{message}</div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES CAROUSEL */}
            <section className="features-section" id="features">
                <div className="section-header">
                    <p className="section-label">What We Offer</p>
                    <h2 className="section-title">Everything You Need to Drive Impact</h2>
                    <p className="section-sub">From AI-powered need extraction to smart volunteer matching — one platform, complete community coordination.</p>
                </div>

                <div className="carousel-wrap">
                    <div className="fade-left"></div>
                    <div className="fade-right"></div>
                    <div className="carousel-track" id="carousel">
                        {/* Features Array mapped for clean repeating */}
                        {[1, 2].map((loopSet) => (
                            <React.Fragment key={loopSet}>
                                <div className="feature-card">
                                    <div className="card-img"><div style={{ fontSize: '48px' }}>📊</div></div>
                                    <div className="card-body">
                                        <div className="card-icon-row" style={{ background: '#e8f4fd' }}>📤</div>
                                        <h4>Data Upload</h4>
                                        <p>Upload community reports via text, CSV, or survey files. Centralize scattered data instantly.</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="card-img" style={{ background: 'linear-gradient(135deg,#e8ecff,#d0d9ff)' }}><div style={{ fontSize: '48px' }}>🤖</div></div>
                                    <div className="card-body">
                                        <div className="card-icon-row" style={{ background: '#eee8ff' }}>🤖</div>
                                        <h4>AI Need Extraction</h4>
                                        <p>Our AI parses raw data and structures urgent needs — food, medical, shelter, water — in seconds.</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="card-img" style={{ background: 'linear-gradient(135deg,#e1f5ee,#b8f0da)' }}><div style={{ fontSize: '48px' }}>⚡</div></div>
                                    <div className="card-body">
                                        <div className="card-icon-row" style={{ background: '#e1f5ee' }}>⚡</div>
                                        <h4>Smart Matching</h4>
                                        <p>Matches volunteers to tasks based on skills, proximity, and urgency with 95% accuracy.</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="card-img" style={{ background: 'linear-gradient(135deg,#faeeda,#ffd9a0)' }}><div style={{ fontSize: '48px' }}>✅</div></div>
                                    <div className="card-body">
                                        <div className="card-icon-row" style={{ background: '#faeeda' }}>✅</div>
                                        <h4>Task Assignment</h4>
                                        <p>NGOs create and assign tasks. Volunteers accept, complete, and mark done — seamlessly.</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="card-img" style={{ background: 'linear-gradient(135deg,#fce8ed,#fbbdd0)' }}><div style={{ fontSize: '48px' }}>📈</div></div>
                                    <div className="card-body">
                                        <div className="card-icon-row" style={{ background: '#fce8ed' }}>📊</div>
                                        <h4>Live Dashboard</h4>
                                        <p>Track urgent needs, volunteer status, and task progress in real-time from one clean view.</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="card-img" style={{ background: 'linear-gradient(135deg,#e8f4fd,#b5d4f4)' }}><div style={{ fontSize: '48px' }}>🔐</div></div>
                                    <div className="card-body">
                                        <div className="card-icon-row" style={{ background: '#e8f4fd' }}>🔐</div>
                                        <h4>Role-Based Access</h4>
                                        <p>Separate NGO and Volunteer flows. Each user gets exactly the tools they need, nothing more.</p>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how-section" id="how">
                <div className="how-inner">
                    <div className="section-header" style={{ padding: 0 }}>
                        <p className="section-label">Process</p>
                        <h2 className="section-title">How SévaSync Works</h2>
                        <p className="section-sub">Four simple steps from raw data to real impact on the ground.</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-num">1</div>
                            <h4>Upload Data</h4>
                            <p>NGO submits community survey reports, field notes, or CSV files to the platform.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">2</div>
                            <h4>AI Extracts Needs</h4>
                            <p>Our AI categorizes urgencies — food, water, medical, shelter — from raw text automatically.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">3</div>
                            <h4>Match Volunteers</h4>
                            <p>The system ranks nearby, available volunteers by skill and location fit for each task.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">4</div>
                            <h4>Track & Complete</h4>
                            <p>Volunteers accept tasks, mark completion, and the dashboard updates in real-time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer id="about">
                <div className="footer-inner">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <div className="logo-text">SévaSync</div>
                            <p>AI-powered platform connecting local NGOs and skilled volunteers to address community needs with speed and precision.</p>
                        </div>
                        <div className="footer-col">
                            <h5>Platform</h5>
                            <ul>
                                <li><a href="#ngo">For NGOs</a></li>
                                <li><a href="#volunteer">For Volunteers</a></li>
                                <li><a href="#dashboard">Dashboard</a></li>
                                <li><a href="#features">AI Features</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Company</h5>
                            <ul>
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#blog">Blog</a></li>
                                <li><a href="#careers">Careers</a></li>
                                <li><a href="#contact">Contact</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Legal</h5>
                            <ul>
                                <li><a href="#privacy">Privacy Policy</a></li>
                                <li><a href="#terms">Terms of Use</a></li>
                                <li><a href="#cookies">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2025 SévaSync. Built with ❤️ for communities.</p>
                        <div className="footer-socials">
                            <a href="#twitter"><i className="fab fa-twitter"></i></a>
                            <a href="#linkedin"><i className="fab fa-linkedin"></i></a>
                            <a href="#github"><i className="fab fa-github"></i></a>
                            <a href="#instagram"><i className="fab fa-instagram"></i></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Login;