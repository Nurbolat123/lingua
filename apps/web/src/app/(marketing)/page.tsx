import Link from "next/link";
import styles from "./landing.module.css";

const CheckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2B3FD6"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function LandingPage() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.logo} href="#top" aria-label="SoyleUp, на главную">
            <span className={`display ${styles.logoName}`}>
              Soyle<span style={{ color: "var(--blue)" }}>Up</span>
            </span>
          </Link>
          <nav className={styles.nav} aria-label="Разделы">
            <a href="#how">Как это работает</a>
            <a href="#parents">Родителям</a>
            <a href="#pricing">Цены</a>
            <a href="#faq">Вопросы</a>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.loginLink} href="/login">
              Войти
            </Link>
            <Link className={`${styles.btn} ${styles.btnDark}`} href="/test">
              Начать бесплатно
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={`${styles.wrap} ${styles.heroGrid}`}>
            <div className={`${styles.stack} ${styles.heroCopy}`}>
              <span className={`${styles.pill} ${styles.pillLime}`}>
                Английский для детей, подростков и взрослых, уровни A1–C1
              </span>
              <h1 className="display">Узнайте свой настоящий уровень английского</h1>
              <p className={styles.lead}>
                Тест по пяти навыкам, персональный план, короткие уроки и куратор, который
                проверяет задания. Прогресс видно ученику и родителям.
              </p>
              <div className={styles.heroActions}>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/test">
                  Начать бесплатно
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <a className={`${styles.btn} ${styles.btnGhost}`} href="#how">
                  Как это устроено
                </a>
              </div>
            </div>

            <figure
              className={`${styles.card} ${styles.cardRaised} ${styles.stack} ${styles.profile}`}
              aria-label="Пример результата теста"
              style={{ margin: 0 }}
            >
              <div className={styles.profileHead}>
                <div className={styles.stack} style={{ gap: 4 }}>
                  <span className={styles.kicker}>Пример English Profile</span>
                  <span style={{ fontSize: 15, color: "var(--muted)" }}>
                    после вступительного теста
                  </span>
                </div>
                <div className={styles.stack} style={{ alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>Overall</span>
                  <span className={`display ${styles.profileOverall}`}>B1+</span>
                </div>
              </div>
              <div className={styles.skills}>
                <div>
                  <div className={styles.skillRow}>
                    <span>Grammar</span>
                    <span>B2</span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: "74%" }} />
                  </div>
                </div>
                <div>
                  <div className={styles.skillRow}>
                    <span>Vocabulary</span>
                    <span>B1</span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: "58%" }} />
                  </div>
                </div>
                <div>
                  <div className={styles.skillRow}>
                    <span>Reading</span>
                    <span>B2</span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: "76%" }} />
                  </div>
                </div>
                <div>
                  <div className={styles.skillRow}>
                    <span>Listening</span>
                    <span>B1</span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: "55%" }} />
                  </div>
                </div>
                <div>
                  <div className={styles.skillRow}>
                    <span>Speaking</span>
                    <span>A2+</span>
                  </div>
                  <div className={styles.bar}>
                    <span className={styles.isWeak} style={{ width: "36%" }} />
                  </div>
                </div>
              </div>
              <div className={styles.tiles}>
                <div className={styles.tile} style={{ background: "var(--lime)" }}>
                  <small>Сильная сторона</small>
                  <strong>Reading</strong>
                </div>
                <div
                  className={styles.tile}
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  <small>Нужно подтянуть</small>
                  <strong>Speaking</strong>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionDark}`}>
          <div className={`${styles.wrap} ${styles.stack} ${styles.questions}`}>
            <h2 className={`display ${styles.h2}`}>
              Не библиотека курсов. Платформа отвечает на три вопроса.
            </h2>
            <div className={styles.grid3}>
              <div className={styles.qCard}>
                <h3>Where am I?</h3>
                <p>
                  Какой у меня реальный уровень? Отдельно по грамматике, лексике, чтению,
                  аудированию и говорению.
                </p>
              </div>
              <div className={styles.qCard}>
                <h3>What should I learn next?</h3>
                <p>Что изучать именно сейчас? План на каждый день строится вокруг ваших слабых навыков.</p>
              </div>
              <div className={styles.qCard}>
                <h3>Am I actually improving?</h3>
                <p>Становится ли английский лучше? Динамика B1 → B1+ → B2 по каждому навыку.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} id="how">
          <div className={styles.wrap}>
            <div className={styles.howHead}>
              <h2 className={`display ${styles.h2}`}>Полный цикл обучения под контролем</h2>
              <p>После каждого круга план обновляется по вашим результатам.</p>
            </div>
            <ol className={`${styles.steps} ${styles.grid3}`}>
              <li className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  1
                </span>
                <h3>Диагностика</h3>
                <p>Тест по 5 навыкам, включая запись устного ответа.</p>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  2
                </span>
                <h3>Персональный план</h3>
                <p>Темы, грамматика, лексика и рекомендуемое время занятий в день.</p>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  3
                </span>
                <h3>Короткие уроки</h3>
                <p>Жизненные ситуации вместо сухих правил: учимся, практикуем, применяем.</p>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  4
                </span>
                <h3>Самостоятельная работа</h3>
                <p>Задания выполняются внутри платформы, поэтому видно, что работа сделана самостоятельно.</p>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  5
                </span>
                <h3>Проверка куратором</h3>
                <p>Куратор оценивает задания, пишет комментарии и корректирует план.</p>
              </li>
              <li className={`${styles.step} ${styles.stepAccent}`}>
                <span className={styles.stepNum} aria-hidden="true">
                  6
                </span>
                <h3>Прогресс и новый план</h3>
                <p>Профиль обновляется после уроков и тестов, родители получают отчёт.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionFlushTop}`}>
          <div className={`${styles.wrap} ${styles.grid2}`}>
            <div className={`${styles.card} ${styles.stack} ${styles.lesson}`}>
              <span className={styles.kicker}>Пример урока</span>
              <h3 className="display">Work-Life Balance</h3>
              <dl>
                <div className={styles.lessonRow}>
                  <dt>Vocabulary</dt>
                  <dd>sustainable, deadline, burnout</dd>
                </div>
                <div className={styles.lessonRow}>
                  <dt>Grammar</dt>
                  <dd>Present Perfect Continuous</dd>
                </div>
                <div className={styles.lessonRow}>
                  <dt>Listening</dt>
                  <dd>интервью о рабочем дне</dd>
                </div>
                <div className={styles.lessonRow}>
                  <dt>Упражнения</dt>
                  <dd>интерактивные задания</dd>
                </div>
                <div className={styles.lessonRow}>
                  <dt>Speaking</dt>
                  <dd>устный ответ голосом</dd>
                </div>
                <div className={styles.lessonRow}>
                  <dt>Мини-тест и домашнее задание</dt>
                  <dd>закрепление</dd>
                </div>
              </dl>
            </div>
            <div className={styles.speaking}>
              <span className={styles.kicker}>Speaking</span>
              <h3 className="display">Говорите, а не только заполняйте пропуски</h3>
              <div className={styles.prompt}>
                <span className={styles.promptIcon} aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                  </svg>
                </span>
                <span lang="en">&ldquo;What makes a person successful?&rdquo;</span>
              </div>
              <div className={styles.feedback}>
                <span>Обратная связь по ответу</span>
                <p lang="en">You used good B2 vocabulary.</p>
                <p lang="en">You repeated &ldquo;very&rdquo; several times. Try: highly / extremely / particularly.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionSand}`} id="parents">
          <div className={`${styles.wrap} ${styles.parentsGrid}`}>
            <div className={`${styles.stack} ${styles.parentsCopy}`}>
              <span className={`${styles.pill} ${styles.pillInk}`}>Родительский кабинет</span>
              <h2 className={`display ${styles.h2}`}>Вы видите, как учится ребёнок, а не только оплату</h2>
              <ul className={styles.checks}>
                <li>
                  <CheckIcon />
                  Посещаемость, время занятий и выполненные уроки
                </li>
                <li>
                  <CheckIcon />
                  Результаты и прогресс по пяти навыкам
                </li>
                <li>
                  <CheckIcon />
                  Комментарии куратора и домашние задания
                </li>
                <li>
                  <CheckIcon />
                  Уведомления о пропусках, невыполненных заданиях и низких результатах
                </li>
              </ul>
            </div>
            <figure
              className={`${styles.card} ${styles.cardRaised} ${styles.stack} ${styles.report}`}
              aria-label="Пример отчёта для родителя"
              style={{ margin: 0 }}
            >
              <div className={styles.reportHead}>
                <strong style={{ fontSize: 18 }}>Отчёт об уроке</strong>
                <span className={`${styles.pill} ${styles.pillLime}`}>Урок завершён</span>
              </div>
              <div className={styles.reportLine}>
                <span>Время занятия</span>
                <strong>35 мин</strong>
              </div>
              <div className={styles.scores}>
                <div className={styles.score}>
                  <span>Grammar</span>
                  <strong>8/10</strong>
                </div>
                <div className={styles.score}>
                  <span>Vocabulary</span>
                  <strong>7/10</strong>
                </div>
                <div className={styles.score}>
                  <span>Listening</span>
                  <strong>9/10</strong>
                </div>
              </div>
              <div className={styles.reportLine}>
                <span>Домашнее задание</span>
                <strong>выполнено</strong>
              </div>
              <div className={styles.comment}>
                <small>Комментарий куратора</small>
                <p>Хороший прогресс в лексике. Рекомендуем больше speaking-практики.</p>
              </div>
            </figure>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`${styles.wrap} ${styles.grid2}`}>
            <div className={styles.audience}>
              <h3 className="display">Детям и подросткам</h3>
              <p>
                Короткие интерактивные уроки, куратор и отчёты для родителей. Аккаунт ученика
                младше 18 лет подключается к родительскому кабинету.
              </p>
            </div>
            <div className={styles.audience}>
              <h3 className="display">Взрослым</h3>
              <p>Английский для работы, переезда или экзамена: уровни от A1 до C1 и план под вашу цель.</p>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionFlushTop}`} id="pricing">
          <div className={styles.wrap}>
            <h2 className={`display ${styles.h2} ${styles.pricingTitle}`}>Начните с бесплатного теста</h2>
            <div className={styles.grid3}>
              <div className={`${styles.card} ${styles.plan}`}>
                <span className={styles.planName}>Диагностика</span>
                <span className={`display ${styles.planPrice}`}>Бесплатно</span>
                <ul>
                  <li>Тест по 5 навыкам</li>
                  <li>English Profile с разбором</li>
                  <li>Рекомендации, с чего начать</li>
                </ul>
                <Link className={`${styles.btn} ${styles.btnOutline}`} href="/test">
                  Пройти тест
                </Link>
              </div>
              <div className={`${styles.card} ${styles.plan}`}>
                <span className={styles.planName}>Самостоятельно</span>
                <span className={`display ${styles.planPrice}`}>
                  [ЦЕНА] <small>/ мес</small>
                </span>
                <ul>
                  <li>Персональный план на каждый день</li>
                  <li>Уроки, упражнения и тесты</li>
                  <li>Словарь и прогресс по навыкам</li>
                </ul>
                <Link className={`${styles.btn} ${styles.btnOutline}`} href="/register">
                  Зарегистрироваться
                </Link>
              </div>
              <div className={`${styles.card} ${styles.plan} ${styles.planFeatured}`}>
                <div className={styles.planTop}>
                  <span className={styles.planName}>С куратором</span>
                  <span className={styles.badge}>Рекомендуем</span>
                </div>
                <span className={`display ${styles.planPrice}`}>
                  [ЦЕНА] <small>/ мес</small>
                </span>
                <ul>
                  <li>Всё из тарифа «Самостоятельно»</li>
                  <li>Проверка заданий и устных ответов куратором</li>
                  <li>Комментарии и корректировка плана</li>
                  <li>Отчёты и уведомления родителям</li>
                </ul>
                <Link className={`${styles.btn} ${styles.btnLime}`} href="/register">
                  Зарегистрироваться
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.faq}`} id="faq">
          <div className={`${styles.wrap} ${styles.faqGrid}`}>
            <h2 className={`display ${styles.h2}`}>Частые вопросы</h2>
            <div>
              <details open>
                <summary>
                  Сколько длится тест?
                  <PlusIcon />
                </summary>
                <p>
                  Около [N] минут. Тест проверяет грамматику, лексику, чтение, аудирование и
                  говорение, а сложность вопросов подстраивается под ваши ответы.
                </p>
              </details>
              <details>
                <summary>
                  Используются ли камера и микрофон?
                  <PlusIcon />
                </summary>
                <p>
                  Микрофон нужен для устных заданий. Камера включается только в отдельных
                  самостоятельных заданиях. И то и другое работает только с вашего согласия, а за
                  учеников младше 18 лет согласие даёт родитель. Согласие можно отозвать в любой
                  момент.
                </p>
              </details>
              <details>
                <summary>
                  Кто такие кураторы?
                  <PlusIcon />
                </summary>
                <p>
                  Преподаватели английского, которые проверяют задания и устные ответы, дают
                  обратную связь и корректируют план обучения.
                </p>
              </details>
              <details>
                <summary>
                  Что видит родитель?
                  <PlusIcon />
                </summary>
                <p>
                  Посещаемость, время занятий, выполненные уроки и домашние задания, результаты по
                  пяти навыкам и комментарии куратора. Если урок пропущен или задание не выполнено,
                  придёт уведомление.
                </p>
              </details>
              <details>
                <summary>
                  Подходит ли платформа взрослым?
                  <PlusIcon />
                </summary>
                <p>Да. Уровни от A1 до C1, а план строится под вашу цель: работа, переезд, экзамен или общение.</p>
              </details>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionFlushTop}`} id="start">
          <div className={styles.cta}>
            <div className={`${styles.stack} ${styles.ctaCopy}`}>
              <h2 className="display">Начните бесплатно уже сегодня</h2>
              <p>
                Зарегистрируйтесь как ученик или родитель. После входа вы попадёте в свой личный
                кабинет.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`${styles.btn} ${styles.btnDark}`} href="/register">
                Зарегистрироваться
              </Link>
              <Link className={`${styles.btn} ${styles.btnOutline}`} href="/login">
                У меня уже есть аккаунт
              </Link>
              <p>Для ученика младше 18 лет потребуется согласие родителя.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={`display ${styles.logoName}`}>
            Soyle<span style={{ color: "var(--blue)" }}>Up</span>
          </span>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Политика конфиденциальности</Link>
          </div>
          <span>© {new Date().getFullYear()} SoyleUp</span>
        </div>
      </footer>
    </>
  );
}
