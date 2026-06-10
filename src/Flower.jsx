import { useEffect, useRef } from 'react';
import './flower.css';

export default function Flower() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Trigger animation when section scrolls into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            section.classList.remove('not-loaded');
          }, 300);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="flower-section not-loaded">
      <div className="flowers">
        {/* Flower 1 */}
        <div className="flower flower--1">
          <div className="flower__leafs flower__leafs--1">
            <div className="emoji-flower">😂</div>
            <div className="flower__light flower__light--1" />
            <div className="flower__light flower__light--2" />
            <div className="flower__light flower__light--3" />
            <div className="flower__light flower__light--4" />
            <div className="flower__light flower__light--5" />
            <div className="flower__light flower__light--6" />
            <div className="flower__light flower__light--7" />
            <div className="flower__light flower__light--8" />
          </div>
          <div className="flower__line">
            <div className="flower__line__leaf flower__line__leaf--1" />
            <div className="flower__line__leaf flower__line__leaf--2" />
            <div className="flower__line__leaf flower__line__leaf--3" />
            <div className="flower__line__leaf flower__line__leaf--4" />
            <div className="flower__line__leaf flower__line__leaf--5" />
            <div className="flower__line__leaf flower__line__leaf--6" />
          </div>
        </div>

        {/* Flower 2 */}
        <div className="flower flower--2">
          <div className="flower__leafs flower__leafs--2">
            <div className="emoji-flower">🤣</div>
            <div className="flower__light flower__light--1" />
            <div className="flower__light flower__light--2" />
            <div className="flower__light flower__light--3" />
            <div className="flower__light flower__light--4" />
            <div className="flower__light flower__light--5" />
            <div className="flower__light flower__light--6" />
            <div className="flower__light flower__light--7" />
            <div className="flower__light flower__light--8" />
          </div>
          <div className="flower__line">
            <div className="flower__line__leaf flower__line__leaf--1" />
            <div className="flower__line__leaf flower__line__leaf--2" />
            <div className="flower__line__leaf flower__line__leaf--3" />
            <div className="flower__line__leaf flower__line__leaf--4" />
          </div>
        </div>

        {/* Flower 3 */}
        <div className="flower flower--3">
          <div className="flower__leafs flower__leafs--3">
            <div className="emoji-flower">🤪</div>
            <div className="flower__light flower__light--1" />
            <div className="flower__light flower__light--2" />
            <div className="flower__light flower__light--3" />
            <div className="flower__light flower__light--4" />
            <div className="flower__light flower__light--5" />
            <div className="flower__light flower__light--6" />
            <div className="flower__light flower__light--7" />
            <div className="flower__light flower__light--8" />
          </div>
          <div className="flower__line">
            <div className="flower__line__leaf flower__line__leaf--1" />
            <div className="flower__line__leaf flower__line__leaf--2" />
            <div className="flower__line__leaf flower__line__leaf--3" />
            <div className="flower__line__leaf flower__line__leaf--4" />
          </div>
        </div>

        {/* Long grass stem */}
        <div className="grow-ans" style={{ '--d': '1.2s' }}>
          <div className="flower__g-long">
            <div className="flower__g-long__top" />
            <div className="flower__g-long__bottom" />
          </div>
        </div>

        {/* Growing grass clusters */}
        <div className="growing-grass">
          <div className="flower__grass flower__grass--1">
            <div className="flower__grass--top" />
            <div className="flower__grass--bottom" />
            <div className="flower__grass__leaf flower__grass__leaf--1" />
            <div className="flower__grass__leaf flower__grass__leaf--2" />
            <div className="flower__grass__leaf flower__grass__leaf--3" />
            <div className="flower__grass__leaf flower__grass__leaf--4" />
            <div className="flower__grass__leaf flower__grass__leaf--5" />
            <div className="flower__grass__leaf flower__grass__leaf--6" />
            <div className="flower__grass__leaf flower__grass__leaf--7" />
            <div className="flower__grass__leaf flower__grass__leaf--8" />
            <div className="flower__grass__overlay" />
          </div>
        </div>

        <div className="growing-grass">
          <div className="flower__grass flower__grass--2">
            <div className="flower__grass--top" />
            <div className="flower__grass--bottom" />
            <div className="flower__grass__leaf flower__grass__leaf--1" />
            <div className="flower__grass__leaf flower__grass__leaf--2" />
            <div className="flower__grass__leaf flower__grass__leaf--3" />
            <div className="flower__grass__leaf flower__grass__leaf--4" />
            <div className="flower__grass__leaf flower__grass__leaf--5" />
            <div className="flower__grass__leaf flower__grass__leaf--6" />
            <div className="flower__grass__leaf flower__grass__leaf--7" />
            <div className="flower__grass__leaf flower__grass__leaf--8" />
            <div className="flower__grass__overlay" />
          </div>
        </div>

        {/* Side leaves */}
        <div className="grow-ans" style={{ '--d': '2.4s' }}>
          <div className="flower__g-right flower__g-right--1">
            <div className="leaf" />
          </div>
        </div>
        <div className="grow-ans" style={{ '--d': '2.8s' }}>
          <div className="flower__g-right flower__g-right--2">
            <div className="leaf" />
          </div>
        </div>

        {/* Front leaves */}
        <div className="grow-ans" style={{ '--d': '2.8s' }}>
          <div className="flower__g-front">
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--1"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--2"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--3"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--4"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--5"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--6"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--7"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--8"><div className="flower__g-front__leaf" /></div>
            <div className="flower__g-front__line" />
          </div>
        </div>

        {/* FR leaves */}
        <div className="grow-ans" style={{ '--d': '3.2s' }}>
          <div className="flower__g-fr">
            <div className="leaf" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--1" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--2" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--3" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--4" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--5" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--6" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--7" />
            <div className="flower__g-fr__leaf flower__g-fr__leaf--8" />
          </div>
        </div>

        {/* Long grass groups */}
        {[
          { cls: 'long-g--0', delays: ['3s','2.2s','3.4s','3.6s'] },
          { cls: 'long-g--1', delays: ['3.6s','3.8s','4s','4.2s'] },
          { cls: 'long-g--2', delays: ['4s','4.2s','4.4s','4.6s'] },
          { cls: 'long-g--3', delays: ['4s','4.2s','3s','3.6s'] },
          { cls: 'long-g--4', delays: ['4s','4.2s','3s','3.6s'] },
          { cls: 'long-g--5', delays: ['4s','4.2s','3s','3.6s'] },
          { cls: 'long-g--6', delays: ['4.2s','4.4s','4.6s','4.8s'] },
          { cls: 'long-g--7', delays: ['3s','3.2s','3.5s','3.6s'] },
        ].map(({ cls, delays }) => (
          <div key={cls} className={`long-g ${cls}`}>
            {delays.map((d, i) => (
              <div key={i} className="grow-ans" style={{ '--d': d }}>
                <div className={`leaf leaf--${i}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
