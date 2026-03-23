import React, { useState, useEffect } from 'react';
import {
    Crown, Check, X, Sparkles, Zap, Shield, BarChart3,
    Video, Award, Download, BookOpen, Bot, Headphones,
    RefreshCw, ChevronRight, Mail, Phone
} from 'lucide-react';
import api from '../api';
import './AdminPremium.css';

const FEATURE_ICONS = {
    ai_tutor_access: Bot,
    live_classes_access: Video,
    certificate_access: Award,
    priority_support: Headphones,
    analytics_access: BarChart3,
};

const FEATURE_LABELS = {
    ai_tutor_access: 'AI Tutor',
    live_classes_access: 'Live Classes',
    certificate_access: 'Certificates',
    priority_support: 'Priority Support',
    analytics_access: 'Analytics',
};

export function AdminPremium() {
    const [plans, setPlans] = useState([]);
    const [activePlanId, setActivePlanId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('annual'); // 'annual' or 'quarterly'
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('admin/premium/');
            const data = res.data?.data || [];
            setActivePlanId(res.data?.active_plan_id || null);

            if (data.length === 0) {
                // Auto-init default plans
                const initRes = await api.post('admin/premium/init/');
                setPlans(initRes.data?.data || []);
                // If there's an active plan id after init, we probably wouldn't have it since it's just initialized, but just in case
            } else {
                setPlans(data);
            }
        } catch (err) {
            console.error('Failed to fetch plans', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan) => {
        setProcessingPlan(plan.id);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post(`admin/premium/${plan.id}/subscribe/`, {
                billing_cycle: billingCycle
            });
            if (res.data?.success) {
                setMessage({
                    type: 'success',
                    text: res.data.message || `Successfully subscribed to ${plan.name}!`
                });
                setActivePlanId(plan.id);
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to process subscription'
            });
        } finally {
            setProcessingPlan(null);
        }
    };

    const getTierIcon = (tier) => {
        if (tier === 'custom') return <Sparkles size={20} />;
        if (tier === 'pro') return <Zap size={20} />;
        return <Crown size={20} />;
    };

    const formatLimit = (val) => val === -1 ? 'Unlimited' : val;

    if (loading) {
        return (
            <div className="admin-premium-page">
                <div className="admin-premium-loading">
                    <RefreshCw size={24} className="spinning" />
                    <span>Loading premium plans...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-premium-page">
            <div className="admin-premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2><Crown size={24} /> Premium Plans</h2>
                    <p>Choose a premium plan for your school to unlock advanced features.</p>
                </div>

                {/* Billing Cycle Toggle */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.05)', padding: '6px',
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button
                        onClick={() => setBillingCycle('quarterly')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: billingCycle === 'quarterly' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: billingCycle === 'quarterly' ? '#fff' : '#94a3b8',
                            fontWeight: billingCycle === 'quarterly' ? '700' : '600',
                            transition: 'all 0.2s', fontSize: '0.8rem'
                        }}
                    >
                        Quarterly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: billingCycle === 'annual' ? 'var(--plan-color, #7c3aed)' : 'transparent',
                            color: billingCycle === 'annual' ? '#fff' : '#94a3b8',
                            fontWeight: billingCycle === 'annual' ? '700' : '600',
                            transition: 'all 0.2s', fontSize: '0.8rem'
                        }}
                    >
                        Annually <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginLeft: '6px' }}>Save 20%</span>
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`admin-premium-msg ${message.type}`}>
                    {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {message.text}
                </div>
            )}

            <div className="admin-premium-grid">
                {plans.map((plan) => {
                    return (
                        <div
                            key={plan.id}
                            className={`admin-premium-card ${plan.is_popular ? 'popular' : ''} ${!plan.is_active ? 'inactive' : ''}`}
                            style={{ '--plan-color': plan.color }}
                        >
                            {/* Badge */}
                            {plan.badge_text && (
                                <div className="admin-premium-badge" style={{ background: plan.color }}>
                                    <Sparkles size={11} /> {plan.badge_text}
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="admin-premium-card-header">
                                <div className="admin-premium-tier-icon" style={{ background: plan.color }}>
                                    {getTierIcon(plan.tier)}
                                </div>
                                <div className="admin-premium-tier-info">
                                    <h3>{plan.name}</h3>
                                    <span className="admin-premium-tier-tag">{plan.tier_display}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="admin-premium-desc">{plan.description}</p>

                            {/* Pricing */}
                            {plan.tier === 'custom' ? (
                                <div className="admin-premium-pricing">
                                    <div className="admin-premium-price" style={{ fontSize: '1.8rem', marginTop: '10px' }}>
                                        Custom Pricing
                                    </div>
                                    <div className="admin-premium-annual">
                                        Based on school size
                                    </div>
                                </div>
                            ) : (
                                <div className="admin-premium-pricing">
                                    <div className="admin-premium-price">
                                        <span className="admin-premium-currency">₹</span>
                                        <span className="admin-premium-amount">
                                            {billingCycle === 'annual'
                                                ? parseFloat(plan.annual_price || 0).toLocaleString('en-IN')
                                                : parseFloat(plan.quarterly_price || 0).toLocaleString('en-IN')
                                            }
                                        </span>
                                        <span className="admin-premium-period">
                                            /{billingCycle === 'annual' ? 'yr' : 'qtr'}
                                        </span>
                                    </div>
                                    {billingCycle === 'annual' && parseFloat(plan.quarterly_price) > 0 && (
                                        <div className="admin-premium-annual">
                                            Equivalent to ₹{Math.round(parseFloat(plan.annual_price) / 4).toLocaleString('en-IN')}/qtr
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Limits */}
                            <div className="admin-premium-limits">
                                <div className="admin-premium-limits-display">
                                    <div className="admin-premium-limit">
                                        <BookOpen size={13} /> <strong>{formatLimit(plan.max_courses)}</strong> courses
                                    </div>
                                    <div className="admin-premium-limit">
                                        <Download size={13} /> <strong>{formatLimit(plan.max_downloads)}</strong> downloads
                                    </div>
                                </div>
                            </div>

                            {/* Feature Toggles */}
                            <div className="admin-premium-features">
                                {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                                    const Icon = FEATURE_ICONS[key];
                                    const enabled = plan[key];
                                    return (
                                        <div
                                            key={key}
                                            className={`admin-premium-feature ${enabled ? 'enabled' : 'disabled'}`}
                                        >
                                            <div className="admin-premium-feature-left">
                                                <Icon size={14} />
                                                <span>{label}</span>
                                            </div>
                                            {enabled ? <Check size={15} className="feature-check" /> : <X size={15} className="feature-x" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Custom Features */}
                            {plan.custom_features?.length > 0 && (
                                <div className="admin-premium-custom">
                                    {plan.custom_features.map((f, i) => (
                                        <div key={i} className="admin-premium-custom-item">
                                            <Check size={12} /> {f}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Subscribe / Current Plan Button */}
                            {plan.is_active && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    {plan.tier === 'custom' ? (
                                        <button
                                            className="admin-premium-save-btn"
                                            style={{ width: '100%', background: '#10b981', color: 'white' }}
                                            onClick={() => setShowContactModal(true)}
                                        >
                                            Contact MentiQ <ChevronRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            className="admin-premium-save-btn"
                                            style={{
                                                width: '100%',
                                                background: activePlanId === plan.id ? 'rgba(52, 211, 153, 0.15)' : '',
                                                color: activePlanId === plan.id ? '#34d399' : '',
                                                boxShadow: activePlanId === plan.id ? 'none' : ''
                                            }}
                                            onClick={() => handleSubscribe(plan)}
                                            disabled={processingPlan === plan.id || activePlanId === plan.id}
                                        >
                                            {processingPlan === plan.id ? (
                                                <><RefreshCw size={15} className="spinning" /> Processing...</>
                                            ) : activePlanId === plan.id ? (
                                                <><Check size={16} /> Current Plan</>
                                            ) : (
                                                <>Subscribe <ChevronRight size={16} /></>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Status indicator for missing active */}
                            {!plan.is_active && (
                                <div className="admin-premium-inactive-tag">
                                    <Shield size={12} /> Currently Unavailable
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="admin-premium-modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="admin-premium-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-premium-modal-header">
                            <div>
                                <h3>Contact MentiQ Enterprise</h3>
                                <p>Get a custom plan tailored for your network.</p>
                            </div>
                            <button className="admin-premium-close-btn" onClick={() => setShowContactModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="admin-premium-modal-content">
                            <div className="admin-premium-contact-card">
                                <div className="admin-premium-contact-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                                    <Mail size={24} />
                                </div>
                                <div className="admin-premium-contact-info">
                                    <h4>Email Us</h4>
                                    <a href="mailto:enterprise@mentiq.com">mentiq.learn@gmail.com</a>
                                    <p>We reply within 24 hours.</p>
                                </div>
                            </div>

                            <div className="admin-premium-contact-card">
                                <div className="admin-premium-contact-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                    <Phone size={24} />
                                </div>
                                <div className="admin-premium-contact-info">
                                    <h4>Call Us Directly</h4>
                                    <a href="tel:+917009812679">+91 70098 12679</a>
                                    <p>Available Mon-Fri, 9am - 6pm EST.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
