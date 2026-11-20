import { motion } from 'framer-motion';
import { FileText, Download, Landmark, BookOpen, Lightbulb } from 'lucide-react';
import { Eyebrow, SplitHeading, Reveal, Depth } from '../primitives.jsx';
import { GOVERNING_BODY, ACADEMIC_COUNCIL, AICTE_IDEA_LAB_TEAM, BOS_DOCUMENTS } from '../experienceData.js';

function MemberList({ title, icon: Icon, members, render }) {
  return (
    <div className="nx-gov-col">
      <h3 className="nx-gov-title"><Icon size={18} /> {title} <em>{members.length}</em></h3>
      <ol className="nx-gov-list">
        {members.map((m, i) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0, x: -30, rotateY: 30 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: (i % 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="nx-gov-num">{String(i + 1).padStart(2, '0')}</span>
            {render(m)}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

export default function GovernanceSection() {
  return (
    <section id="nx-governance" className="nx-section nx-governance" data-shape="1" aria-label="Governance">
      <div className="nx-container">
        <Eyebrow index={12}>Governance</Eyebrow>
        <SplitHeading text="Guided by statute, driven by people." className="nx-h2" gradientWords={[4, 5]} />

        <Depth intensity={0.7}>
        <div className="nx-gov-grid nx-gov-grid-top">
          <MemberList
            title="Governing Body"
            icon={Landmark}
            members={GOVERNING_BODY}
            render={(m) => (
              <div><strong>{m.name}</strong><span>{m.role} · {m.category}</span><em>{m.organization}</em></div>
            )}
          />
          <MemberList
            title="Academic Council"
            icon={BookOpen}
            members={ACADEMIC_COUNCIL}
            render={(m) => (
              <div><strong>{m.name}</strong><span>{m.role}</span><em>{m.designation}</em></div>
            )}
          />
        </div>
        </Depth>

        <div className="nx-gov-grid nx-gov-grid-2">
          <Reveal className="nx-glass nx-idea">
            <h3 className="nx-gov-title"><Lightbulb size={18} /> AICTE IDEA Lab Team</h3>
            <div className="nx-idea-list">
              {AICTE_IDEA_LAB_TEAM.map((m) => (
                <div key={m.id}><strong>{m.name}</strong><span>{m.role} · {m.department}</span></div>
              ))}
            </div>
          </Reveal>
          <Reveal className="nx-glass nx-bos" delay={0.1}>
            <h3 className="nx-gov-title"><FileText size={18} /> Board of Studies — Minutes</h3>
            {BOS_DOCUMENTS.map((d) => (
              <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" className="nx-doc">
                <FileText size={18} />
                <span><strong>{d.title}</strong><em>{d.date}</em></span>
                <Download size={16} />
              </a>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
