'use client';

import { ArrowLeft, ShieldAlert, Lock, FileWarning } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

/* ── Shared layout ── */
function LegalLayout({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const goHome = useAppStore((s) => s.goHome);
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <button onClick={goHome} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex items-center gap-2.5">
            {icon}
            <h1 className="text-lg font-bold text-white">{title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-32 md:pb-16">
        {children}
      </div>
    </div>
  );
}

const sectionClass = 'mb-8';
const headingClass = 'text-base font-semibold text-white mb-3';
const textClass = 'text-white/60 text-sm leading-relaxed';
const listClass = 'space-y-2.5 ml-1';
const bulletDot = 'shrink-0 w-1 h-1 rounded-full bg-white/30 mt-2';
const highlightBox = 'p-4 rounded-xl bg-red-500/[0.06] border border-red-500/10';

/* ════════════════════════════════════════════
   WARNING / DISCLAIMER
   ════════════════════════════════════════════ */
export function WarningPage() {
  return (
    <LegalLayout icon={<ShieldAlert className="w-5 h-5 text-red-400" />} title="Disclaimer">
      <div className={sectionClass}>
        <div className={highlightBox}>
          <p className="text-red-300 text-sm font-medium mb-1">⚠️ Important Notice</p>
          <p className={textClass}>
            StreamVault does not host, store, or distribute any copyrighted audio-visual content.
            All media accessible through this platform is sourced from third-party, non-affiliated
            services. Users access content entirely at their own risk and discretion.
          </p>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>No Media Hosting</h2>
        <p className={textClass}>
          StreamVault functions as an informational directory and aggregator. We index metadata
          (titles, descriptions, posters, ratings) from publicly available sources such as The Movie
          Database (TMDB). Any streaming links or embedded players point to external, independently
          operated third-party services.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Third-Party Content</h2>
        <p className={textClass}>
          All videos, images, and media files referenced by StreamVault are hosted on external servers.
          We have no control over the content, availability, or legality of these third-party sources.
          StreamVault is not responsible for any content accessed through external links.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>User Responsibility</h2>
        <p className={textClass}>By using StreamVault, you acknowledge and agree to the following:</p>
        <div className={listClass}>
          {[
            'You are solely responsible for ensuring your use complies with all applicable local, state, national, and international laws.',
            'Streaming or downloading copyrighted content without proper authorization may violate intellectual property laws in your jurisdiction.',
            'StreamVault does not encourage, endorse, or promote piracy or copyright infringement in any form.',
            'Use of this service is at your own risk. We are not liable for any damages arising from your use of the platform.',
          ].map((t, i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}>{t}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Age Restriction</h2>
        <p className={textClass}>
          StreamVault is intended for general audiences. However, some content indexed from
          third-party sources may be intended for mature audiences only. Users under the age of 18
          should use this service only with parental or guardian supervision.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>No Warranty</h2>
        <p className={textClass}>
          StreamVault is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without any warranties of any kind,
          either express or implied. We do not guarantee uninterrupted or error-free operation of the service.
        </p>
      </div>
    </LegalLayout>
  );
}

/* ════════════════════════════════════════════
   PRIVACY POLICY
   ════════════════════════════════════════════ */
export function PrivacyPage() {
  return (
    <LegalLayout icon={<Lock className="w-5 h-5 text-emerald-400" />} title="Privacy Policy">
      <div className={sectionClass}>
        <p className="text-white/30 text-xs mb-4">Last updated: June 2025</p>
        <p className={textClass}>
          This Privacy Policy explains how StreamVault (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects,
          uses, and protects your information when you use our service. By using StreamVault, you
          consent to the practices described below.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Information We Collect</h2>
        <p className={textClass + ' mb-3'}>We collect minimal information to provide and improve our service:</p>
        <div className={listClass}>
          {[
            ['Account Information:', 'If you create an account, we store your username, email address (if provided), and an encrypted password. Authentication is handled securely via Supabase.'],
            ['Watch History:', 'We store titles you have viewed locally on your device. If you are logged in, this history is saved to our database for syncing across devices.'],
            ['Watchlist:', 'Titles you add to your watchlist are stored locally or synced to your account if logged in.'],
            ['Usage Data:', 'We may collect anonymous, aggregated usage statistics (e.g., pages visited, features used) to improve the service. No personally identifiable information is included.'],
          ].map(([label, desc], i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}><strong className="text-white/80">{label}</strong> {desc}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Information We Do NOT Collect</h2>
        <div className={listClass}>
          {['Payment or financial information', 'Personal streaming activity or viewing habits for advertising purposes', 'Location data or IP addresses beyond what is necessary for basic service operation', 'Contact information for marketing or third-party distribution'].map((t, i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}>{t}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>How We Use Your Information</h2>
        <div className={listClass}>
          {['To provide and maintain your account and personalized features', 'To sync your watch history and watchlist across devices', 'To improve and optimize the service based on anonymous usage patterns', 'To respond to support requests (if you contact us)'].map((t, i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}>{t}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Cookies & Local Storage</h2>
        <p className={textClass}>
          StreamVault uses browser local storage to save preferences (such as your selected streaming
          provider and watchlist) on your device. We do not use tracking cookies. We use only
          essential cookies for authentication sessions managed by our auth provider (Supabase).
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Third-Party Services</h2>
        <p className={textClass + ' mb-3'}>StreamVault integrates with the following third-party services, each with their own privacy policies:</p>
        <div className={listClass}>
          {[['TMDB', 'for movie and TV show metadata'], ['Supabase', 'for authentication and database services'], ['YouTube', 'for trailer and video content'], ['MangaDex', 'for manga content']].map(([name, desc], i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}><strong className="text-white/80">{name}</strong> — {desc}</span></div>
          ))}
        </div>
        <p className={textClass + ' mt-3'}>
          We encourage you to review the privacy policies of these services. StreamVault does not
          control and is not responsible for the privacy practices of these third parties.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Data Security</h2>
        <p className={textClass}>
          We take reasonable measures to protect your personal information. Passwords are encrypted
          and never stored in plain text. However, no method of electronic transmission or storage is
          100% secure. We cannot guarantee absolute security of your data.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Your Rights</h2>
        <p className={textClass + ' mb-3'}>You have the right to:</p>
        <div className={listClass}>
          {['Access the personal data we hold about you', 'Request deletion of your account and associated data', 'Clear your local watch history and watchlist at any time from your profile settings', 'Opt out of any data collection by simply not creating an account (the service works without one)'].map((t, i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}>{t}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Contact</h2>
        <p className={textClass}>
          If you have questions about this Privacy Policy, please contact us through our
          GitHub repository or community channels.
        </p>
      </div>
    </LegalLayout>
  );
}

/* ════════════════════════════════════════════
   DMCA
   ════════════════════════════════════════════ */
export function DmcaPage() {
  return (
    <LegalLayout icon={<FileWarning className="w-5 h-5 text-amber-400" />} title="DMCA">
      <div className={sectionClass}>
        <p className="text-white/30 text-xs mb-4">Digital Millennium Copyright Act Notice</p>
        <p className={textClass}>
          StreamVault respects the intellectual property rights of others and expects its users to
          do the same. In accordance with the Digital Millennium Copyright Act of 1998
          (&ldquo;DMCA&rdquo;), we will respond expeditiously to claims of copyright infringement.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Our Stance</h2>
        <p className={textClass}>
          StreamVault does not host, store, or distribute any copyrighted media files. We operate
          as a metadata-based directory that links to publicly available information about movies,
          TV shows, and related content. All actual media content is served by independent,
          third-party sources that we do not control or operate.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Reporting Copyright Infringement</h2>
        <p className={textClass + ' mb-3'}>
          If you believe that your copyrighted work is being made available through our service in a
          way that constitutes copyright infringement, please provide us with the following
          information in writing:
        </p>
        <div className={listClass}>
          {[
            ['Identification of the copyrighted work', 'that you claim has been infringed.'],
            ['Identification of the infringing material', '— provide the specific URL or reference to the content on StreamVault that you believe infringes your rights.'],
            ['Your contact information', '— including your name, address, telephone number, and email address.'],
            ['A statement of good faith', 'that you believe the use of the material is not authorized by the copyright owner, its agent, or the law.'],
            ['A statement under penalty of perjury', 'that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf.'],
            ['Your physical or electronic signature.'],
          ].map(([label, desc], i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}><strong className="text-white/80">{label}</strong> {desc}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Response to Valid DMCA Notices</h2>
        <p className={textClass + ' mb-3'}>Upon receiving a valid DMCA takedown notice that complies with the requirements above, we will:</p>
        <div className={listClass}>
          {['Acknowledge receipt of your notice promptly', 'Remove or disable access to the referenced content from our index', 'Attempt to contact the party responsible for the infringing content if applicable', 'Take reasonable steps to prevent recurrence'].map((t, i) => (
            <div key={i} className="flex gap-2.5"><span className={bulletDot} /><span className={textClass}>{t}</span></div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Counter-Notification</h2>
        <p className={textClass}>
          If you believe that your content was removed or disabled as a result of a mistake or
          misidentification, you may send a counter-notification. Your counter-notification must
          include your identification, the content that was removed, a statement under penalty of
          perjury that you have a good faith belief the content was removed in error, your consent
          to jurisdiction, and your physical or electronic signature.
        </p>
      </div>

      <div className={sectionClass}>
        <h2 className={headingClass}>Contact</h2>
        <p className={textClass}>
          All DMCA takedown notices and counter-notifications should be sent through our GitHub
          repository issues or via the community contact channels provided.
        </p>
      </div>
    </LegalLayout>
  );
}
