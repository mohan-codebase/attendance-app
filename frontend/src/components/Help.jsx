import React, { useState } from 'react';
import {
  UserRound,
  UserRoundCheck,
  UsersRound,
  FileText,
  Settings as SettingsIcon,
  Headphones,
  ChevronDown,
} from 'lucide-react';
import '../css/Help.css';

const TOPICS = [
  {
    icon: UserRound,
    title: 'Get started',
    body: 'Set up your institute, add your first students, and take attendance in a few minutes.',
  },
  {
    icon: UserRoundCheck,
    title: 'Managing Attendance',
    body: 'Effortlessly track, update, and manage attendance with a user-friendly web app.',
  },
  {
    icon: UsersRound,
    title: 'User Management',
    body: 'Easily add, assign roles, and manage users for seamless access control.',
  },
  {
    icon: FileText,
    title: 'Reporting',
    body: 'Generate insightful attendance reports with customizable date ranges and export options.',
  },
  {
    icon: SettingsIcon,
    title: 'Settings',
    body: 'Customize notifications, working hours, and preferences for a tailored experience.',
  },
  {
    icon: Headphones,
    title: 'Support',
    body: 'Access FAQs, live chat, and email support for quick assistance.',
  },
];

const FAQS = [
  {
    q: 'Can I export attendance data?',
    a: 'Yes. Open Report → Student Performance, choose your course, batch, month and mode, press Generate Report, then use Export CSV to download exactly what the table is showing.',
  },
  {
    q: 'What roles can be assigned to users?',
    a: 'Every account currently signs in with the same level of access to its own institute. Per-user roles such as admin, staff and viewer are not available yet.',
  },
  {
    q: 'How do I edit an attendance record?',
    a: 'Go to Attendances → Take attendance and pick the date you want to change. Existing marks load in, so you can set a student to Present, Late or Absent and press Submit again.',
  },
];

const Help = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="help">
      <h1 className="help-heading">Need help?</h1>

      <div className="help-grid">
        {TOPICS.map(({ icon: Icon, title, body }) => (
          <article className="help-card" key={title}>
            <Icon size={34} strokeWidth={1.5} className="help-card-icon" />
            <h2 className="help-card-title">{title}</h2>
            <p className="help-card-body">{body}</p>
          </article>
        ))}
      </div>

      <h2 className="help-heading help-heading--faq">FAQs</h2>

      <ul className="help-faqs">
        {FAQS.map(({ q, a }, index) => {
          const open = openFaq === index;
          return (
            <li className={`help-faq ${open ? 'is-open' : ''}`} key={q}>
              <button
                className="help-faq-q"
                onClick={() => setOpenFaq(open ? null : index)}
                aria-expanded={open}
              >
                <span>{q}</span>
                <ChevronDown size={20} strokeWidth={1.75} className="help-faq-chevron" />
              </button>
              {open && <p className="help-faq-a">{a}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Help;
