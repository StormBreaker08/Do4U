import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import AnimatedChat from "../components/AnimatedChat";
import Footer from "../components/Footer";
import logo from "../assets/your-logo.png";

export default function RoleSelect() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const testimonials = [
    {
      rating: "⭐⭐⭐⭐⭐",
      quote:
        "I posted a 'please save my moving day' task and had two Genies show up with a van in under an hour. Absolute lifesaver!",
      avatar: "jess",
      author: "Jess, new in town",
      color: "pink",
    },
    {
      rating: "⭐⭐⭐⭐⭐",
      quote:
        "I run errands between classes. It's flexible, fast, and the wallet makes payouts painless.",
      avatar: "amir",
      author: "Amir, student & Genie",
      color: "yellow",
    },
    {
      rating: "⭐⭐⭐⭐⭐",
      quote:
        "Found my go-to handyman through Do4U. Fixed my fence, hung shelves, and assembled furniture. Now I just text him directly through the app!",
      avatar: "maria",
      author: "Maria, homeowner",
      color: "blue",
    },
    {
      rating: "⭐⭐⭐⭐⭐",
      quote:
        "The escrow system is genius. I don't worry about getting paid anymore. Job done = instant release. Simple.",
      avatar: "carlos",
      author: "Carlos, delivery Genie",
      color: "orange",
    },
    {
      rating: "⭐⭐⭐⭐⭐",
      quote:
        "Needed groceries picked up while stuck at work. Posted at 3pm, had them delivered by 4pm. This app is magic.",
      avatar: "priya",
      author: "Priya, busy professional",
      color: "pink",
    },
    {
      rating: "⭐⭐⭐⭐⭐",
      quote:
        "Made $400 last weekend doing yard cleanups. Love that I can choose which jobs to take and see ratings before accepting.",
      avatar: "jake",
      author: "Jake, weekend Genie",
      color: "blue",
    },
  ];

  const handleStart = (role) => {
    navigate(`/login?role=${role}`);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCarouselIndex((prev) => (prev + 1) % testimonials.length);
    } else if (isRightSwipe) {
      setCarouselIndex(
        (prev) => (prev - 1 + testimonials.length) % testimonials.length,
      );
    }
  };

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCarouselIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const goToSlide = (index) => {
    setCarouselIndex(index);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Parallax effect for hero section
      const heroCopy = document.querySelector(".landing__hero-copy");
      const heroDevice = document.querySelector(".landing__hero-device");

      if (heroCopy || heroDevice) {
        const scrollY = window.scrollY;
        // Apply parallax only when viewing hero section (roughly top 800px)
        if (scrollY < 800) {
          const parallaxSpeed = 0.5;
          const offset = scrollY * parallaxSpeed;

          if (heroCopy) {
            heroCopy.style.transform = `translateY(${offset * 0.3}px)`;
          }
          if (heroDevice) {
            heroDevice.style.transform = `translateY(${offset * 0.2}px)`;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll(
      ".landing__hero-copy, .landing__hero-device, .landing__flow-card, .landing__card, .landing__story-card, .landing__marquee, .landing__cta-inner",
    );

    elementsToAnimate.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing">
      <div className="landing__inner">
        {/* Top nav */}
        <header className="landing__nav">
          <div className="landing__brand">
            <img src={logo} alt="Do4U" className="landing__brand-icon" />
          </div>

          <nav className="landing__nav-links">
            <a href="#home" className="landing__nav-link">
              Home
            </a>
            <a href="#how-it-works" className="landing__nav-link">
              How it Works
            </a>
            <a href="#stories" className="landing__nav-link">
              Stories
            </a>
          </nav>

          <div className="landing__nav-cta">
            <button
              className="btn btn--ghost landing__nav-btn"
              onClick={() => handleStart("user")}
            >
              Sign in
            </button>
            <button
              className="btn btn--primary landing__nav-btn"
              onClick={() => handleStart("user")}
            >
              Browse Tasks
            </button>
          </div>
        </header>

        {/* Hero */}
        <main id="home" className="landing__main">
          <section
            className="landing__hero"
            aria-labelledby="landing-hero-title"
          >
            <div className="landing__hero-copy">
              <p className="landing__eyebrow">START GETTING THINGS DONE</p>
              <h1 id="landing-hero-title" className="landing__hero-headline">
                No chores.{" "}
                <span className="landing__hero-headline--accent">
                  Just Do4U.
                </span>
              </h1>
              <p className="landing__subtitle">
                Skip the endless back-and-forth. Do4U matches you with trusted
                Genies who jump straight into real work &mdash; from errands and
                deliveries to one-off life savers.
              </p>

              <div className="landing__hero-actions">
                <button
                  className="btn btn--primary landing__hero-btn"
                  onClick={() => handleStart("user")}
                >
                  I Need Help
                </button>
                <button
                  className="btn btn--ghost landing__hero-btn"
                  onClick={() => handleStart("genie")}
                >
                  Meet Genies
                </button>
              </div>
            </div>

            {/* Phone-style preview */}
            <div className="landing__hero-device" aria-hidden="true">
              <div className="landing__device-frame">
                <div className="landing__device-camera"></div>
                <div className="landing__device-header">
                  <span className="landing__device-time">11:11</span>
                  <span className="landing__device-status">
                    <span className="landing__device-wifi">
                      <span className="wifi-arc wifi-arc-1"></span>
                      <span className="wifi-arc wifi-arc-2"></span>
                      <span className="wifi-arc wifi-arc-3"></span>
                      <span className="wifi-dot"></span>
                    </span>
                    <span className="landing__device-battery" />
                  </span>
                </div>
                <AnimatedChat />
              </div>
            </div>
          </section>

          {/* How It Works Flow */}
          <section id="how-it-works" className="landing__flow-section">
            <div className="landing__flow-header">
              <h2 className="landing__flow-heading">
                HOW WE
                <span className="landing__flow-heading-highlight">
                  FIX TASKS
                </span>
              </h2>
              <p className="landing__flow-subheading">
                No more endless scrolling. No more fake ratings.
              </p>
              <p className="landing__flow-subheading">
                Just real people getting real work done.
              </p>
            </div>

            <div className="landing__flow-cards">
              <div className="landing__flow-card landing__flow-card--pink">
                <div className="landing__flow-number">01</div>
                <h3 className="landing__flow-card-title">POST IN 60 SECONDS</h3>
                <p className="landing__flow-card-text">
                  <strong>Your task is urgent. Your time is precious.</strong>{" "}
                  Describe what you need—garden cleanup, furniture assembly,
                  airport pickup, grocery runs—set your budget, and hit post. No
                  forms. No hassle. Just honest work requests.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>

              <div className="landing__flow-card landing__flow-card--yellow">
                <div className="landing__flow-number">02</div>
                <h3 className="landing__flow-card-title">
                  GENIES RESPOND FAST
                </h3>
                <p className="landing__flow-card-text">
                  <strong>Real people, instant offers.</strong> Nearby Genies
                  see your task and make competitive offers. Check their
                  verified profiles, ratings from real users, and past completed
                  jobs. Choose who fits your vibe and budget.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>

              <div className="landing__flow-card landing__flow-card--blue">
                <div className="landing__flow-number">03</div>
                <h3 className="landing__flow-card-title">SECURE PAYMENT</h3>
                <p className="landing__flow-card-text">
                  <strong>Money stays safe until job's done.</strong> Chat
                  directly with your Genie. Confirm details, timing, and
                  requirements. Payment is held in our secure escrow
                  wallet—released only when you approve the completed work.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>

              <div className="landing__flow-card landing__flow-card--orange">
                <div className="landing__flow-number">04</div>
                <h3 className="landing__flow-card-title">RATE & BUILD TRUST</h3>
                <p className="landing__flow-card-text">
                  <strong>Every job builds reputation.</strong> Leave honest
                  ratings and reviews. Reward top Genies with tips and repeat
                  bookings. Find your go-to helpers for regular tasks. Build
                  your trusted crew over time.
                </p>
                <div className="landing__flow-arrow">→</div>
              </div>
            </div>
          </section>

          {/* Marquee */}
          <section className="landing__marquee" aria-label="Do4U vibe">
            <div className="landing__marquee-track">
              <span>DO4U GETS IT DONE</span>
              <span>POST IN 60 SECONDS</span>
              <span>VERIFIED GENIES</span>
              <span>SECURE ESCROW</span>
              <span>TRUSTED RATINGS</span>
              <span>REAL TASK MARKETPLACE</span>
              <span>DO4U GETS IT DONE</span>
              <span>POST IN 60 SECONDS</span>
            </div>
          </section>

          {/* Split grid: tiles + how it works */}
          <section className="landing__sections">
            <div className="landing__card-grid">
              <article className="landing__card">
                <div className="landing__card-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="13"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="24" cy="24" r="6" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="landing__card-title">Your Chaos, Solved</h3>
                <p className="landing__card-text">
                  Last-minute airport run? Garden grass too long? Furniture
                  assembly nightmare? Drop the task with all your details, set
                  what you&apos;ll pay, and watch Genies compete to help you.
                </p>
              </article>

              <article className="landing__card">
                <div className="landing__card-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M24 4L28 16H40L30 22L34 34L24 28L14 34L18 22L8 16H20L24 4Z"
                      fill="currentColor"
                    />
                    <path
                      d="M32 20L36 30L28 25L20 30L24 20"
                      fill="currentColor"
                      opacity="0.5"
                    />
                  </svg>
                </div>
                <h3 className="landing__card-title">Smart Matching</h3>
                <p className="landing__card-text">
                  Filter by location, task type, budget, and timeline. See
                  verified Genies with real ratings, completed jobs, and honest
                  reviews from people just like you.
                </p>
              </article>

              <article className="landing__card">
                <div className="landing__card-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 24C8 16.27 13.2 9.74 20 7.5V8C20 10.2 21.8 12 24 12C26.2 12 28 10.2 28 8V7.5C34.8 9.74 40 16.27 40 24C40 33.94 32.06 42 24 42C15.94 42 8 33.94 8 24Z"
                      fill="currentColor"
                    />
                    <rect
                      x="20"
                      y="18"
                      width="8"
                      height="10"
                      rx="1"
                      fill="var(--bg)"
                    />
                  </svg>
                </div>
                <h3 className="landing__card-title">Clear Communication</h3>
                <p className="landing__card-text">
                  Built-in chat with smart prompts keeps everything smooth.
                  &quot;Need parking info?&quot; &quot;Tools required?&quot;
                  &quot;Where&apos;s the key?&quot; No awkward back-and-forth.
                </p>
              </article>
            </div>

            <aside className="landing__how-card">
              <h2 className="landing__how-title">
                What if you could skip all the chaos?
              </h2>
              <p className="landing__how-text">
                Do4U turns your to-dos into done-dids. No endless scrolling, no
                fake profiles, no payment nightmares. Just honest people doing
                honest work with complete transparency.
              </p>
              <ul className="landing__list">
                <li>
                  <strong>Post once, get real responses in minutes</strong> —
                  Active Genies near you jump on tasks fast
                </li>
                <li>
                  <strong>Secure escrow wallet</strong> — Money held safely
                  until you confirm job completion
                </li>
                <li>
                  <strong>Real ratings & verified profiles</strong> — Trust
                  built through actual completed work
                </li>
                <li>
                  <strong>Direct messaging</strong> — Chat with your Genie,
                  clarify details, track progress
                </li>
                <li>
                  <strong>Reward points & loyalty</strong> — Both users and
                  Genies earn rewards for great service
                </li>
              </ul>
              <button
                className="btn btn--primary landing__how-btn"
                onClick={() => handleStart("user")}
              >
                Start Your First Task →
              </button>
            </aside>
          </section>

          {/* Stories / social proof - Carousel on Mobile */}
          <section id="stories" className="landing__stories">
            <div className="landing__stories-inner">
              <h2 className="landing__stories-title">
                What Do4U fans are saying
              </h2>

              {/* Carousel Container */}
              <div className="landing__carousel-container">
                <div
                  className="landing__stories-grid landing__carousel"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {testimonials.map((testimonial, index) => (
                    <figure
                      key={index}
                      className={`landing__story-card landing__story-card--${testimonial.color} landing__carousel-slide ${
                        index === carouselIndex ? "active" : ""
                      }`}
                      style={{
                        transform: `translateX(calc(-${carouselIndex * 100}% + ${carouselIndex * 24}px))`,
                      }}
                    >
                      <div className="landing__story-rating">
                        {testimonial.rating}
                      </div>
                      <blockquote className="landing__story-quote">
                        &quot;{testimonial.quote}&quot;
                      </blockquote>
                      <figcaption className="landing__story-author">
                        <div
                          className="landing__story-avatar"
                          data-avatar={testimonial.avatar}
                        >
                          {testimonial.avatar.charAt(0).toUpperCase()}
                        </div>
                        <span>— {testimonial.author}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>

                {/* Desktop Navigation - Arrows */}
                <div className="landing__carousel-nav">
                  <button
                    className="landing__carousel-btn landing__carousel-btn--prev"
                    onClick={prevSlide}
                    aria-label="Previous testimonial"
                    title="Previous"
                  >
                    ←
                  </button>
                  <button
                    className="landing__carousel-btn landing__carousel-btn--next"
                    onClick={nextSlide}
                    aria-label="Next testimonial"
                    title="Next"
                  >
                    →
                  </button>
                </div>

                {/* Pagination Dots */}
                <div className="landing__carousel-dots">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`landing__carousel-dot ${index === carouselIndex ? "active" : ""}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to testimonial ${index + 1}`}
                      title={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="landing__cta" id="join">
            <div className="landing__cta-inner">
              <h2 className="landing__cta-title">Ready to join the club?</h2>
              <p className="landing__cta-text">
                Be the first to try Do4U in your city. No spam, just a heads up
                when we&apos;re live and a link to claim early rewards.
              </p>

              <div className="landing__cta-actions">
                <button
                  className="btn btn--primary landing__cta-btn"
                  onClick={() => handleStart("user")}
                >
                  Join Do4U
                </button>
                <Link
                  to="/login?role=genie"
                  className="btn btn--ghost landing__cta-btn"
                  style={{ textDecoration: "none" }}
                >
                  Become a Genie
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <Footer />
        </main>
      </div>

      {/* Scroll-to-Top Button */}
      <button
        className={`scroll-to-top ${showScrollTop ? "show" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Back to top"
      >
        ↑
      </button>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        className="landing__fab"
        onClick={() => handleStart("user")}
        aria-label="Sign up for Do4U"
        title="Sign Up"
      >
        Sign Up
      </button>
    </div>
  );
}
