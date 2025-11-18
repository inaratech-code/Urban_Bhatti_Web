export default function Footer() {
  return (
    <footer className="border-t border-[#f5caa0] bg-white/90">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-8 text-sm text-[#3f2a1d] md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-[#381808]">Urban Bhatti</p>
          <p className="text-xs uppercase tracking-[0.35em] text-[#f36a10]">Est. 2081</p>
        </div>
        <address className="flex flex-col gap-1 text-center not-italic text-sm text-[#5b341f] md:text-left">
          <a href="tel:+9779800000000" className="transition hover:text-[#f36a10]">
            Call: +977-9800000000
          </a>
          <a href="mailto:hello@urbanbhatti.com" className="transition hover:text-[#f36a10]">
            Email: hello@urbanbhatti.com
          </a>
          <span>Location: Chatakpur, Dhangadhi</span>
        </address>
        <div className="text-center text-xs text-[#7c5236] md:text-right">
          <p>&copy; {new Date().getFullYear()} Inara Tech. All rights reserved.</p>
          <p>VAT inclusive rates. Taste the tradition.</p>
        </div>
      </div>
    </footer>
  );
}

