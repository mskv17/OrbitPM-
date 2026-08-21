import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./css/home.css";

// Configurable object data for pricing plans (can be easily replaced by server API data)
export const DEFAULT_PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for freelancers and small teams getting started with agile management.",
    priceMonthly: 0,
    priceYearly: 0,
    badge: "Free Forever",
    isPopular: false,
    ctaText: "Get Started Free",
    ctaLink: "/auth",
    features: [
      "Up to 5 active projects",
      "Kanban & List views",
      "Basic team collaboration",
      "1 GB workspace storage",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Designed for growing product teams needing advanced tracking & integrations.",
    priceMonthly: 19,
    priceYearly: 15,
    badge: "Most Popular",
    isPopular: true,
    ctaText: "Start 14-Day Free Trial",
    ctaLink: "/auth",
    features: [
      "Unlimited active projects",
      "Sprint planning & Burndown charts",
      "Advanced role-based permissions",
      "100 GB workspace storage",
      "Custom project workflows",
      "Priority 24/7 support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Dedicated infrastructure, custom security, and dedicated account managers.",
    priceMonthly: 49,
    priceYearly: 39,
    badge: "Enterprise Grade",
    isPopular: false,
    ctaText: "Contact Sales",
    ctaLink: "/auth",
    features: [
      "Unlimited workspace & storage",
      "SSO & SAML authentication",
      "Custom SLA & audit logs",
      "Dedicated success manager",
      "Custom API integrations",
      "On-premise deployment option",
    ],
  },
];

// Configurable object data for features list
export const DEFAULT_FEATURES = [
  {
    id: "agile-boards",
    icon: "📋",
    title: "Agile Task Boards",
    description: "Drag-and-drop Kanban boards, backlog grooming, and customizable sprint workflows.",
  },
  {
    id: "realtime-collab",
    icon: "⚡",
    title: "Real-time Sync",
    description: "Collaborate seamlessly with live updates, comments, and task activity feeds.",
  },
  {
    id: "insights-analytics",
    icon: "📈",
    title: "Velocity & Analytics",
    description: "Track project throughput, cycle time, and team performance with automated reports.",
  },
  {
    id: "automated-rules",
    icon: "🤖",
    title: "Smart Automation",
    description: "Automate repetitive assignments, status transitions, and email notifications.",
  },
  {
    id: "secure-roles",
    icon: "🛡️",
    title: "Role-Based Access",
    description: "Granular access controls ensure team members only access what they need.",
  },
  {
    id: "integrations",
    icon: "🔌",
    title: "Seamless Integrations",
    description: "Connect OrbitPM with your favorite developer tools, GitHub, Slack, and Figma.",
  },
];

export const Home = ({
  pricingPlans = DEFAULT_PRICING_PLANS,
  featuresList = DEFAULT_FEATURES,
}) => {
  const [isYearly, setIsYearly] = useState(false);

  // Progressive enhancement scroll reveal effect (SEO & crawler friendly)
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="home-container">
      {/* HERO SECTION WITH AMBIENT ANIMATED GLOW BACKGROUND */}
      <header className="home-section hero-section">
        <div className="hero-ambient-bg" aria-hidden="true">
          <div className="hero-glow-orb hero-glow-orb--1" />
          <div className="hero-glow-orb hero-glow-orb--2" />
          <div className="hero-glow-orb hero-glow-orb--3" />
        </div>

        <div className="hero-badge reveal-on-scroll">
          <span>✨ OrbitPM 2.0</span>
          <span>• Modern Project Workspace</span>
        </div>

        <h1 className="hero-title reveal-on-scroll delay-1">
          Plan. Track. Deliver. <br />
          <span>Project management simplified.</span>
        </h1>

        <p className="hero-subtitle reveal-on-scroll delay-2">
          OrbitPM empowers modern agile teams to streamline task workflows, track sprint velocity,
          and ship high-impact products faster.
        </p>

        <div className="hero-actions reveal-on-scroll delay-3">
          <Link to="/auth" className="hero-btn-primary">
            <span>Get Started Free</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a href="#features" className="hero-btn-secondary">
            Explore Features
          </a>
        </div>

        {/* Animated OrbitPM Project Board (Plan -> Track -> Deliver) */}
        <div className="hero-mockup-card reveal-on-scroll delay-4" aria-hidden="true">
          {/* Board Header */}
          <div className="board-header">
            <div className="board-header-left">
              <div className="mockup-dots">
                <span className="mockup-dot red" />
                <span className="mockup-dot yellow" />
                <span className="mockup-dot green" />
              </div>
              <div className="board-title-group">
                <span className="board-title">Sprint 24</span>
                <span className="board-subtitle">• Plan → Track → Deliver</span>
              </div>
            </div>
            <div className="board-header-right">
              <div className="board-progress-info">
                <span className="progress-label">Sprint Progress</span>
                <div className="board-progress-bar">
                  <div className="board-progress-fill" />
                </div>
              </div>
            </div>
          </div>

          {/* Board Columns Grid */}
          <div className="board-columns">
            {/* COLUMN 1: TODO */}
            <div className="board-column">
              <div className="column-header">
                <div className="column-header-title">
                  <span className="status-dot dot-todo" />
                  <span>TODO</span>
                </div>
                <span className="column-badge badge-todo">2</span>
              </div>
              <div className="column-cards">
                <div className="project-card card-todo-1">
                  <div className="card-tags">
                    <span className="tag tag-blue">Backend</span>
                    <span className="priority-badge priority-high">High</span>
                  </div>
                  <h4 className="card-title">Fix authentication flow</h4>
                  <div className="card-footer">
                    <span className="card-avatar">JD</span>
                    <span className="card-meta">Oct 24</span>
                  </div>
                </div>

                <div className="project-card card-todo-2 card-animated-todo">
                  <div className="card-tags">
                    <span className="tag tag-cyan">API</span>
                  </div>
                  <h4 className="card-title">Build REST API endpoints</h4>
                  <div className="card-footer">
                    <span className="card-avatar">AK</span>
                    <span className="card-meta">Oct 25</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="board-column">
              <div className="column-header">
                <div className="column-header-title">
                  <span className="status-dot dot-progress" />
                  <span>IN PROGRESS</span>
                </div>
                <span className="column-badge badge-progress">1</span>
              </div>
              <div className="column-cards">
                {/* Animated Moving Card (Glides from IN PROGRESS -> DONE) */}
                <div className="project-card card-animated-moving">
                  <div className="card-tags">
                    <span className="tag tag-purple">Frontend</span>
                    <span className="card-status-badge anim-status-badge">Deploying</span>
                  </div>
                  <h4 className="card-title">Dashboard UI & Charts</h4>
                  <div className="card-footer">
                    <span className="card-avatar">SM</span>
                    <span className="card-check-icon anim-check">✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: DONE */}
            <div className="board-column">
              <div className="column-header">
                <div className="column-header-title">
                  <span className="status-dot dot-done" />
                  <span>DONE</span>
                </div>
                <span className="column-badge badge-done">1</span>
              </div>
              <div className="column-cards">
                <div className="project-card card-done-static">
                  <div className="card-tags">
                    <span className="tag tag-green">Release</span>
                    <span className="completed-tag">✓ Done</span>
                  </div>
                  <h4 className="card-title">Deploy v1.2 to Production</h4>
                  <div className="card-footer">
                    <span className="card-avatar">OP</span>
                    <span className="card-meta">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section id="features" className="home-section">
        <div className="home-section-header reveal-on-scroll">
          <span className="home-eyebrow">Features</span>
          <h2 className="home-section-title">Everything you need to ship on time</h2>
          <p className="home-section-description">
            Built for modern engineering, product, and design teams who value clarity and momentum.
          </p>
        </div>

        <div className="features-grid">
          {featuresList.map((feat, idx) => (
            <div
              key={feat.id}
              className={`feature-card reveal-on-scroll delay-${(idx % 3) + 1}`}
            >
              <div className="feature-icon">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-description">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="home-section">
        <div className="home-section-header reveal-on-scroll">
          <span className="home-eyebrow">Pricing</span>
          <h2 className="home-section-title">Simple, transparent pricing</h2>
          <p className="home-section-description">
            Choose the plan that fits your team. Scale up or down anytime without hidden fees.
          </p>
        </div>

        {/* Billing Toggle Switch */}
        <div className="pricing-billing-toggle reveal-on-scroll delay-1">
          <span
            className={`billing-label ${!isYearly ? "is-active" : ""}`}
            onClick={() => setIsYearly(false)}
          >
            Monthly Billing
          </span>
          <div
            className={`toggle-switch ${isYearly ? "is-yearly" : ""}`}
            onClick={() => setIsYearly((prev) => !prev)}
            role="button"
            tabIndex={0}
            aria-label="Toggle annual billing"
          >
            <div className="toggle-handle" />
          </div>
          <span
            className={`billing-label ${isYearly ? "is-active" : ""}`}
            onClick={() => setIsYearly(true)}
          >
            Yearly Billing
          </span>
          <span className="discount-badge">Save 20%</span>
        </div>

        {/* Pricing Cards Grid (Injected from Object Data) */}
        <div className="pricing-grid">
          {pricingPlans.map((plan, idx) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.isPopular ? "is-popular" : ""} reveal-on-scroll delay-${idx + 1}`}
              >
                {plan.isPopular && (
                  <div className="pricing-popular-badge">{plan.badge}</div>
                )}

                <h3 className="pricing-plan-name">{plan.name}</h3>
                <p className="pricing-plan-desc">{plan.description}</p>

                <div className="pricing-price-container">
                  <span className="pricing-amount">${price}</span>
                  <span className="pricing-period">
                    {price === 0 ? "free forever" : isYearly ? "/user/month (billed yearly)" : plan.period}
                  </span>
                </div>

                <ul className="pricing-features-list">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="pricing-feature-item">
                      <span className="pricing-feature-icon">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  className={`pricing-cta-btn ${
                    plan.isPopular ? "pricing-cta-btn--primary" : "pricing-cta-btn--outline"
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-mark">⬢</span>
              <span>OrbitPM</span>
            </Link>
            <p className="footer-tagline">
              Modern project management for agile teams. Plan, track, and ship high-impact software.
            </p>
          </div>

          <div>
            <h4 className="footer-column-title">Product</h4>
            <ul className="footer-links">
              <li><a href="#features" className="footer-link">Features</a></li>
              <li><a href="#pricing" className="footer-link">Pricing</a></li>
              <li><Link to="/auth" className="footer-link">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-column-title">Resources</h4>
            <ul className="footer-links">
              <li><a href="#features" className="footer-link">Documentation</a></li>
              <li><a href="#features" className="footer-link">Guides & Tutorials</a></li>
              <li><a href="#features" className="footer-link">API Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-column-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#features" className="footer-link">About Us</a></li>
              <li><a href="#features" className="footer-link">Careers</a></li>
              <li><a href="#features" className="footer-link">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} OrbitPM Inc. All rights reserved.</span>
          <span>Designed with care for agile project teams.</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
