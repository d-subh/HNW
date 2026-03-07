import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Activity, MessageSquare, ArrowRight, Shield, Zap, Brain, Lock, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import './App.css';

// --- TypeScript Interfaces for the FastAPI Backend Response ---
interface BackendMetrics {
  price_spike_pct: number;
  volume_spike_ratio: number;
  social_media_hype: number;
}

interface BackendRisk {
  score: number;
  status: string;
  reasons: string[];
}

interface SocialIntelligence {
  daily_mentions: number;
  mention_spike_pct: number;
  bot_activity_pct: number;
  detected_keywords: string[];
  sentiment_label: string;
}

interface ChartPoint {
  date: string;
  price: number;
  volume: number;
}

interface ProcessedData {
  ticker: string;
  metrics: BackendMetrics;
  risk: BackendRisk;
  chartData: ChartPoint[];
  socialIntelligence: SocialIntelligence;
}

interface ImageAnalysisResult {
  file_name: string;
  image_risk_score: number;
  is_suspicious: boolean;
  risk_level: string;
  detected_manipulations: {
    editing_artifacts: any;
    fake_interface: any;
    chart_tampering: any;
    inconsistencies: any;
  };
  suspicious_findings: Array<{
    category: string;
    issue: string;
    confidence: number;
  }>;
  summary: {
    total_issues_found: number;
    highest_risk_category: string;
  };
}

export default function App() {
  const [tickerInput, setTickerInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ProcessedData | null>(null);
  const [showHome, setShowHome] = useState<boolean>(true);
  
  // Image analysis states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showImageAnalysis, setShowImageAnalysis] = useState<boolean>(false);

  const fetchStockAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;

    setLoading(true);
    setError(null);
    setDashboardData(null);

    try {
      // Connect to your local FastAPI Python server
      const response = await fetch(`http://127.0.0.1:8000/analyze/${tickerInput.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error('Stock data not found or API error. Try another ticker.');
      }

      const data = await response.json();

      // Format the arrays from Python into objects for Recharts
      const formattedChartData: ChartPoint[] = data.chart_data.dates.map((dateStr: string, index: number) => ({
        date: dateStr,
        price: data.chart_data.prices[index],
        volume: data.chart_data.volumes[index],
      }));

      setDashboardData({
        ticker: data.ticker,
        metrics: data.metrics,
        risk: data.risk_assessment,
        chartData: formattedChartData,
        socialIntelligence: data.social_intelligence
      });

      // Automatically hide home and show results
      setShowHome(false);

    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColorClass = (score: number) => {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setImageError(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) {
      setImageError('Please select an image first');
      return;
    }

    setImageLoading(true);
    setImageError(null);
    setImageAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('http://127.0.0.1:8000/analyze-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze image');
      }

      const data: ImageAnalysisResult = await response.json();
      setImageAnalysis(data);
      setShowImageAnalysis(true);
    } catch (err: any) {
      setImageError(err.message || 'Failed to analyze image');
    } finally {
      setImageLoading(false);
    }
  };

  const resetImageAnalysis = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageAnalysis(null);
    setImageError(null);
    setShowImageAnalysis(false);
  };

  // Home page with animated hero section
  if (showHome) {
    return (
      <div className="app-container">
        {/* Animated Background */}
        <div className="animated-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>

        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-logo">
            <Shield size={28} className="logo-icon" />
            <span>StockShield AI</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => {
              const elem = document.querySelector('.features') as HTMLElement;
              if (elem) window.scrollTo({ top: elem.offsetTop, behavior: 'smooth' });
            }}>Features</button>
            <button className="nav-link" onClick={() => {
              const elem = document.querySelector('.how-it-works') as HTMLElement;
              if (elem) window.scrollTo({ top: elem.offsetTop, behavior: 'smooth' });
            }}>How It Works</button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Detect Stock Market <span className="gradient-text">Manipulation</span>
            </h1>
            <p className="hero-subtitle">
              Advanced AI-powered analysis to identify pump & dump schemes and protect your investments
            </p>
            
            <form className="hero-search" onSubmit={(e) => {
              fetchStockAnalysis(e);
            }}>
              <input
                type="text"
                className="hero-input"
                placeholder="Enter stock ticker (e.g., AAPL, NVDA, ZOMATO.NS)"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="hero-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {error && <div className="hero-error">{error}</div>}

            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Stocks Analyzed</div>
              </div>
              <div className="stat">
                <div className="stat-value">99.8%</div>
                <div className="stat-label">Accuracy Rate</div>
              </div>
              <div className="stat">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Real-time Monitoring</div>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="hero-illustration">
            <div className="chart-animation">
              <div className="chart-bar bar-1"></div>
              <div className="chart-bar bar-2"></div>
              <div className="chart-bar bar-3"></div>
              <div className="chart-bar bar-4"></div>
              <div className="chart-bar bar-5"></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features">
          <h2 className="section-title">Why Choose StockShield?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon brain-icon">
                <Brain size={32} />
              </div>
              <h3>AI-Powered Detection</h3>
              <p>Machine learning algorithms analyze market patterns to identify suspicious trading activity</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon zap-icon">
                <Zap size={32} />
              </div>
              <h3>Real-Time Analysis</h3>
              <p>Get instant insights on price spikes, volume surges, and social media sentiment</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon lock-icon">
                <Lock size={32} />
              </div>
              <h3>Secure & Reliable</h3>
              <p>Your data is protected with enterprise-grade security and privacy standards</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon trending-icon">
                <TrendingUp size={32} />
              </div>
              <h3>Detailed Reports</h3>
              <p>Comprehensive analysis with actionable insights for informed investment decisions</p>
            </div>
          </div>
        </div>

        {/* Image Analysis Section */}
        <div className="image-analysis-section">
          <h2 className="section-title">Detect Fake Profit Screenshots</h2>
          
          {!showImageAnalysis ? (
            <div className="image-upload-container">
              <div className="upload-area">
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-input" className="upload-label">
                  <Upload size={48} />
                  <h3>Upload Image to Analyze</h3>
                  <p>Our AI checks for edited screenshots, fake trading interfaces, and manipulated charts</p>
                  <button type="button" className="upload-btn">
                    Select Image
                  </button>
                </label>
              </div>

              {imagePreview && (
                <div className="image-preview-section">
                  <div className="preview-image">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                  <div className="image-actions">
                    <button className="analyze-btn" onClick={analyzeImage} disabled={imageLoading}>
                      {imageLoading ? (
                        <>
                          <span className="spinner"></span>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Analyze Image
                          <Zap size={18} />
                        </>
                      )}
                    </button>
                    <button className="reset-btn" onClick={resetImageAnalysis}>
                      Choose Different Image
                    </button>
                  </div>
                </div>
              )}

              {imageError && <div className="image-error">{imageError}</div>}
            </div>
          ) : imageAnalysis ? (
            <div className="image-results-container fade-in">
              <div className={`image-result-header ${imageAnalysis.risk_level.toLowerCase()}`}>
                <div className="risk-indicator">
                  {imageAnalysis.is_suspicious ? (
                    <AlertCircle size={32} />
                  ) : (
                    <CheckCircle size={32} />
                  )}
                </div>
                <div className="risk-info">
                  <h3>Risk Level: {imageAnalysis.risk_level}</h3>
                  <p>Image Risk Score: {imageAnalysis.image_risk_score}%</p>
                </div>
              </div>

              {imageAnalysis.suspicious_findings && imageAnalysis.suspicious_findings.length > 0 && (
                <div className="findings-section">
                  <h4>Detected Issues ({imageAnalysis.summary.total_issues_found})</h4>
                  <div className="findings-list">
                    {imageAnalysis.suspicious_findings.map((finding, idx) => (
                      <div key={idx} className="finding-item">
                        <AlertTriangle size={18} className="finding-icon" />
                        <div className="finding-content">
                          <strong>{finding.category}</strong>
                          <p>{finding.issue}</p>
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill" 
                              style={{ width: `${finding.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!imageAnalysis.is_suspicious && (
                <div className="no-issues-found">
                  <CheckCircle size={48} />
                  <p>No suspicious patterns detected in this image</p>
                </div>
              )}

              <button className="analyze-another-btn" onClick={resetImageAnalysis}>
                Analyze Another Image
              </button>
            </div>
          ) : null}
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Enter Stock Ticker</h4>
              <p>Search for any stock ticker to analyze</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>AI Analysis</h4>
              <p>Our AI processes historical and real-time data</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Get Results</h4>
              <p>View detailed risk assessment and metrics</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2026 StockShield AI. Protecting your investments with advanced technology.</p>
        </footer>
      </div>
    );
  }

  // Dashboard/Detector page
  return (
    <div className="app-container">
      {/* Header with Back Button */}
      <header className="detector-header">
        <button className="back-btn" onClick={() => {
          setShowHome(true);
          setDashboardData(null);
          setTickerInput('');
        }}>
          ← Back
        </button>
        <h1>Stock Analysis Results</h1>
      </header>

      {/* Error Handling */}
      {error && <div className="error-message">{error}</div>}

      {/* Main Dashboard */}
      {dashboardData && (
        <div className="dashboard fade-in">
          
          {/* Top Row: Main Status */}
          <div className="card primary-card">
            <div className="status-left">
              <div className="metric-label">Target Asset</div>
              <div className="metric-value ticker-value">{dashboardData.ticker}</div>
            </div>
            <div className="status-right">
              <div className="metric-label">AI Risk Verdict</div>
              <div className={`metric-value verdict-badge ${getRiskColorClass(dashboardData.risk.score)}`}>
                {dashboardData.risk.status}
              </div>
              <div className={`risk-score ${getRiskColorClass(dashboardData.risk.score)}`}>
                {dashboardData.risk.score}/100
              </div>
            </div>
          </div>

          {/* Middle Row: Metrics */}
          <div className="grid-3">
            <div className="card metric-card">
              <div className="metric-header">
                <TrendingUp size={24} className={getRiskColorClass(dashboardData.metrics.price_spike_pct > 15 ? 80 : 20)} />
                <div className="metric-label">Price Spike</div>
              </div>
              <div className="metric-value metric-number">+{dashboardData.metrics.price_spike_pct.toFixed(2)}%</div>
              <div className="metric-description">24h price change</div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <Activity size={24} className={getRiskColorClass(dashboardData.metrics.volume_spike_ratio > 3 ? 80 : 20)} />
                <div className="metric-label">Volume Surge</div>
              </div>
              <div className="metric-value metric-number">{dashboardData.metrics.volume_spike_ratio.toFixed(1)}x</div>
              <div className="metric-description">Volume multiplier</div>
            </div>

            <div className="card metric-card">
              <div className="metric-header">
                <MessageSquare size={24} className="risk-medium" />
                <div className="metric-label">Social Sentiment</div>
              </div>
              <div className="metric-value metric-number">{dashboardData.metrics.social_media_hype}/100</div>
              <div className="metric-description">Hype score</div>
            </div>
          </div>

          {/* Social Media Intelligence Section */}
          <div className="card social-card">
            <div className="metric-label social-label">Social Media Intelligence</div>
            <div className="social-grid">
              <div className="social-metric">
                <div className="social-value">{dashboardData.socialIntelligence.daily_mentions}</div>
                <div className="social-desc">Daily Mentions</div>
              </div>
              <div className="social-metric">
                <div className="social-value">+{dashboardData.socialIntelligence.mention_spike_pct}%</div>
                <div className="social-desc">Mention Spike</div>
              </div>
              <div className="social-metric">
                <div className="social-value">{dashboardData.socialIntelligence.bot_activity_pct}%</div>
                <div className="social-desc">Bot Activity</div>
              </div>
              <div className="social-metric">
                <div className="social-value">{dashboardData.socialIntelligence.sentiment_label}</div>
                <div className="social-desc">Sentiment</div>
              </div>
            </div>
            {dashboardData.socialIntelligence.detected_keywords.length > 0 && (
              <div className="keywords-section">
                <div className="keywords-label">Detected Keywords:</div>
                <div className="keywords-list">
                  {dashboardData.socialIntelligence.detected_keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row: Charts & AI Reasons */}
          <div className="grid-2">
            {/* Left Column: Charts */}
            <div className="card charts-card">
              <div className="chart-section">
                <div className="metric-label chart-label">30-Day Price Trend</div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(tick) => tick.slice(5)} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Line type="monotone" dataKey="price" name="Price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-section">
                <div className="metric-label chart-label">Trading Volume</div>
                <div className="chart-container-small">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#10b981' }}
                        formatter={(value: any) => value.toLocaleString()}
                      />
                      <Bar dataKey="volume" name="Volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: AI Detection Flags */}
            <div className="card flags-card">
              <div className="metric-label flags-label">AI Detection Flags</div>
              
              {dashboardData.risk.reasons.length === 0 ? (
                <div className="no-flags">
                  <Shield size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                  <div style={{ color: 'var(--success)', textAlign: 'center' }}>
                    No suspicious patterns detected by the AI model.
                  </div>
                </div>
              ) : (
                <ul className="flag-list">
                  {dashboardData.risk.reasons.map((reason, index) => (
                    <li key={index} className="flag-item">
                      <AlertTriangle size={18} className="risk-medium" style={{ flexShrink: 0 }} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* New Search Button */}
          <div className="new-search-section">
            <button className="new-search-btn" onClick={() => {
              setShowHome(true);
              setDashboardData(null);
              setTickerInput('');
            }}>
              Analyze Another Stock
            </button>
          </div>

        </div>
      )}
    </div>
  );
}