import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-[#f5caa0] bg-white/90">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-8 text-sm text-[#3f2a1d] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-gray-200 flex-shrink-0">
            <Image
              src="/LOGO.jpg"
              alt="Urban Bhatti logo"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-[#381808]">Urban Bhatti</p>
            <p className="text-xs uppercase tracking-[0.35em] text-[#f36a10]">Est. 2081</p>
          </div>
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

