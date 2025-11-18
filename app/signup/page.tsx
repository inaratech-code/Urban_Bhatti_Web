import Link from 'next/link';

import SignupForm from '../../components/SignupForm';

export const metadata = {
  title: 'Sign up | Urban Bhatti'
};

const highlights = [
  'Save delivery addresses and phone numbers',
  'Track your momo cravings from order to delivery',
  'Unlock late-night perks and personalised recommendations'
];

export default function SignupPage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] px-6 py-12 text-white shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <span className="hidden sm:inline-flex rounded-full border border-white/40 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
            Join the crew
          </span>
          <h1 className="text-3xl font-bold sm:text-4xl">Create your Urban Bhatti account</h1>
          <p className="hidden sm:block max-w-xl text-sm text-white/80">
            Whether you&apos;re ordering poleko at midnight or managing the kitchen, one account keeps your favourites, orders and delivery details in sync.
          </p>
          <p className="sm:hidden max-w-xl text-sm text-white/80">
            Create your account to save your favourites, track orders, and order in a couple of taps.
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6 rounded-3xl border border-[#f4c6a5] bg-[#fff7f2] px-4 py-8 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-brand-dark">I&apos;m here for the food</h2>
            <p className="hidden sm:block text-sm text-gray-600">
              Sign up as a guest, save your go-to dishes, and order in a couple of taps next time hunger strikes.
            </p>
            <p className="sm:hidden text-sm text-gray-600">
              Sign up to save your go-to dishes and order in a couple of taps.
            </p>
            <ul className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
              {highlights.map((highlight) => (
                <li key={highlight} className="rounded-2xl bg-white p-4 shadow-sm">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <SignupForm />
        </div>

        <aside className="hidden lg:block space-y-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-dark">I manage Urban Bhatti</h2>
            <p className="text-sm text-gray-600">
              Admin access is invite-only to keep your data secure. Use your invite link to set a password or sign in with your administrator email.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Need access? Request an invite from the restaurant owner so we can verify your role before enabling the dashboard.
          </div>
          <div className="space-y-3">
            <Link
              href="/signin?callbackUrl=/admin"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
            >
              Admin Sign In
            </Link>
            <Link
              href="mailto:hello@urbanbhatti.com?subject=Urban%20Bhatti%20Admin%20Access"
              className="inline-flex w-full items-center justify-center rounded-full border border-brand-orange px-5 py-2 text-sm font-semibold text-brand-orange hover:bg-brand-orange hover:text-white"
            >
              Request an invite
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
