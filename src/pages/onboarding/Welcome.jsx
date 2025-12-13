import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import logo from "../../assets/images/prayinverse.png";

const Welcome = () => {
  useEffect(() => {
    // Lock scroll and ensure full height
    document.body.classList.add("no-scroll");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";

    // Set CSS custom property for true viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      document.body.classList.remove("no-scroll");
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
      document.documentElement.style.height = "auto";
      document.body.style.height = "auto";
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  return (
    <div
      className="w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden"
      style={{
        height: "100vh",
        minHeight: "calc(var(--vh, 1vh) * 100)",
      }}
    >
      <div className="grid md:grid-cols-2 w-full max-w-6xl rounded-none md:rounded-2xl md:shadow-2xl overflow-hidden h-full md:h-auto md:my-auto">
        {/* Left info section - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-center bg-gray-100 text-gray-800 p-10">
          <div className="max-w-md text-left space-y-4 w-full">
            <h2 className="text-3xl font-bold">ABOUT PRAY IN VERSES</h2>
            <p className="text-sm leading-relaxed opacity-80 text-justify">
              Pray in Verses is a unique devotional platform designed to help
              you connect deeply with God&apos;s Word through prayer. Instead of
              rushing through chapters or skimming familiar passages, this
              resource guides you to pray scripture itself one verse at a time.
              Each verse becomes not just something to read, but something to
              internalize, declare, and live out. Our goal is to bridge the gap
              between Bible study and prayer life by turning every verse into
              prayer.
            </p>

            {/* 5 quick links as buttons: 3 on the first row, 2 on the second */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Link
                to="/privacy-policy"
                title="Privacy Policy"
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
              >
                Privacy Policy
              </Link>
              <Link
                to="/eula"
                title="End-User License"
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold  border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
              >
                End-User License
              </Link>
              <Link
                to="/terms-of-service"
                title="Terms of Service"
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold  border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
              >
                Terms Of Service
              </Link>
              <Link
                to="/donation-policy"
                title="Donation Policy"
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold  border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
              >
                Donation Policy
              </Link>
              <Link
                to="/community-guidelines"
                title="Community Guidelines"
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold  border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
              >
                Community Guidelines
              </Link>
            </div>
          </div>
        </div>

        {/* Right signup/login section */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary text-white h-full min-h-full px-6 py-8 md:px-6 md:py-8">
          <div className="flex flex-col items-center justify-center w-full max-w-sm h-full">
            {/* Spacer for top */}
            <div className="flex-1 md:hidden min-h-[2rem]"></div>

            {/* Logo */}
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <img
                src={logo}
                alt="logo"
                className="w-28 md:w-32 md:mb-4 h-28 md:h-32 object-contain mx-auto"
              />
            </div>

            {/* Title section */}
            <div className="text-center mb-8 md:mb-2 flex-shrink-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                Pray in Verses
              </h1>
              <p className="text-base md:text-lg opacity-90 leading-tight">
                Turn every bible verse into prayers
              </p>
            </div>

            {/* Buttons section */}
            <div className="flex flex-col w-full space-y-4 md:space-y-4 flex-shrink-0 mb-8 md:mb-0">
              <Link to="/signup">
                <Button
                  variant="primary"
                  className="w-full py-3 md:py-3 text-lg md:text-lg rounded-xl font-medium"
                >
                  Sign Up
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="tertiary"
                  className="w-full py-3 md:py-3 text-lg md:text-lg rounded-xl font-medium"
                >
                  Login
                </Button>
              </Link>
            </div>

            {/* Spacer for bottom */}
            <div className="flex-1 md:hidden min-h-[2rem]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
