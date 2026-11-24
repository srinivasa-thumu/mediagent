const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');

function closeMenu() {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const diagnosticScenarios = {
  lab: [
    { title: 'Patient calls', context: 'A patient wants information about a laboratory test.', ai: 'Welcome to our diagnostic centre. How can I help you?', patient: 'I want to know about a CBC blood test.', collected: 'CBC inquiry', summary: ['CBC', 'Centre visit', 'Preferred branch pending', 'To be discussed', 'Patient inquiry recorded'] },
    { title: 'Understand the request', context: 'The assistant records which service the patient is asking about.', ai: 'You’re asking about a CBC blood test. Is that right?', patient: 'Yes, that’s right.', collected: 'Test requested: CBC', summary: ['CBC', 'Centre visit', 'Preferred branch pending', 'To be discussed', 'Test inquiry confirmed'] },
    { title: 'Approved test information', context: 'Only information provided and approved by the centre is shared.', ai: 'I can share the centre-approved information about this test. Would you like to request a booking?', patient: 'Yes, please.', collected: 'Booking request: yes', summary: ['CBC', 'Centre visit', 'Preferred branch pending', 'To be discussed', 'Booking request captured'] },
    { title: 'Preferred location', context: 'The patient can share a preferred branch for the team to review.', ai: 'Which centre location would you prefer?', patient: 'Your Hyderabad centre, please.', collected: 'Preferred branch noted', summary: ['CBC', 'Centre visit', 'Hyderabad', 'To be discussed', 'Branch preference captured'] },
    { title: 'Preferred time', context: 'A time preference is recorded for the booking team.', ai: 'What day or time would work best for you?', patient: 'Tomorrow morning, if possible.', collected: 'Morning preference recorded', summary: ['CBC', 'Centre visit', 'Hyderabad', 'Tomorrow morning', 'Time preference captured'] },
    { title: 'Next action', context: 'The request is organized for the diagnostic centre team to review.', ai: 'Thank you. I’ve recorded your request for our team to review.', patient: 'Thank you.', collected: 'Request ready for team review', summary: ['CBC', 'Centre visit', 'Hyderabad', 'Tomorrow morning', 'Team review requested'] },
  ],
  home: [
    { title: 'Patient calls', context: 'A patient wants to ask about a home sample collection.', ai: 'Welcome to our diagnostic centre. How can I help you?', patient: 'Can I get a blood sample collected at home?', collected: 'Home collection inquiry', summary: ['Blood test', 'Home visit requested', 'Address not yet collected', 'Preferred time pending', 'Collection inquiry recorded'] },
    { title: 'Understand the request', context: 'The assistant captures the service and collection preference.', ai: 'I can record a home collection request for the team. Which test do you need?', patient: 'A CBC blood test.', collected: 'Test requested: CBC', summary: ['CBC', 'Home visit requested', 'Address not yet collected', 'Preferred time pending', 'Collection request captured'] },
    { title: 'Approved service information', context: 'Home collection details follow the centre’s configured service area.', ai: 'I’ll check the service details configured by the centre. May I note your area?', patient: 'I’m in Hyderabad.', collected: 'Service area noted', summary: ['CBC', 'Home visit requested', 'Hyderabad', 'Preferred time pending', 'Service area for review'] },
    { title: 'Collection address', context: 'The relevant address details are collected for staff review.', ai: 'Please share the address for the collection request.', patient: 'Near the main post office, Hyderabad.', collected: 'Address details recorded for review', summary: ['CBC', 'Home visit requested', 'Hyderabad', 'Address shared for review', 'Staff review requested'] },
    { title: 'Preferred time', context: 'The requested collection window is recorded for the team.', ai: 'What time would be convenient for you?', patient: 'Tomorrow morning, around 8.', collected: 'Morning preference recorded', summary: ['CBC', 'Home visit requested', 'Hyderabad', 'Tomorrow around 8 AM', 'Time preference captured'] },
    { title: 'Next action', context: 'The team receives a collection request to confirm availability.', ai: 'Thank you. Our team will review the request and confirm the details.', patient: 'That works, thank you.', collected: 'Collection request ready for team review', summary: ['CBC', 'Home visit requested', 'Hyderabad', 'Tomorrow around 8 AM', 'Team to review and confirm'] },
  ],
};

const scenarioTabs = [...document.querySelectorAll('.scenario-tab')];
const stepTabs = [...document.querySelectorAll('.demo-step')];
const scenarioState = { selected: 'lab', step: 0 };
const stepPanel = document.querySelector('.demo-stage');
const previousButton = document.querySelector('.demo-prev');
const nextButton = document.querySelector('.demo-next');

function showDiagnosticStep() {
  const { selected, step } = scenarioState;
  const content = diagnosticScenarios[selected][step];
  const panel = stepPanel;
  panel.querySelector('.stage-kicker').textContent = `STEP ${String(step + 1).padStart(2, '0')}`;
  panel.querySelector('.demo-stage-copy h3').textContent = content.title;
  panel.querySelector('.stage-context').textContent = content.context;
  panel.querySelector('.ai-line p span').textContent = content.ai;
  panel.querySelector('.patient-line p span').textContent = content.patient;
  panel.querySelector('.step-collected b').textContent = content.collected;
  const fields = [...panel.querySelectorAll('.booking-fields dd')];
  content.summary.forEach((value, index) => { fields[index].textContent = value; });
  stepTabs.forEach((tab, index) => {
    const active = index === step;
    tab.classList.toggle('active', active);
    tab.classList.toggle('visited', index < step);
    tab.setAttribute('aria-selected', String(active));
  });
  previousButton.disabled = step === 0;
  nextButton.disabled = step === diagnosticScenarios[selected].length - 1;
  document.querySelector('.step-count').textContent = `Step ${step + 1} of 6`;
}

scenarioTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    scenarioState.selected = tab.dataset.scenario;
    scenarioState.step = 0;
    scenarioTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    showDiagnosticStep();
  });
});

stepTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    scenarioState.step = Number(tab.dataset.step);
    showDiagnosticStep();
  });
});

previousButton.addEventListener('click', () => {
  scenarioState.step = Math.max(0, scenarioState.step - 1);
  showDiagnosticStep();
});
nextButton.addEventListener('click', () => {
  scenarioState.step = Math.min(5, scenarioState.step + 1);
  showDiagnosticStep();
});

