import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';
import '../styles/talentadmin.css';

const emptyStudent = { first_name: '', last_name: '', gender: '', date_of_birth: '', student_id: '', password: '', school_id: '' };
const emptyTalent = { student: '', talent: '', proficiency_level: 1, notes: '' };
const emptyClub = { name: '', focus: '', description: '', school: '' };
const emptyMembership = { student: '', club: '' };
const emptyEvaluation = { studentTalent: '', criteria: {}, feedback: '' };
const list = (response) => response?.data?.results || (Array.isArray(response?.data) ? response.data : []);

export default function SportTeacherPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [talents, setTalents] = useState([]);
  const [studentTalents, setStudentTalents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [results, setResults] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [talentForm, setTalentForm] = useState(emptyTalent);
  const [clubForm, setClubForm] = useState(emptyClub);
  const [membershipForm, setMembershipForm] = useState(emptyMembership);
  const [evaluationForm, setEvaluationForm] = useState(emptyEvaluation);
  const [submissionForm, setSubmissionForm] = useState({ student: '', talent: '', title: '', description: '', media: null });
  const [resultForm, setResultForm] = useState({ student: '', competition: '', score: '', grade: '', award: 'none', rank: '', venue: '' });
  const [activeModal, setActiveModal] = useState(null);

  const schoolId = currentUser?.school;

  const schoolStudents = useMemo(() => {
    return students.filter((student) => {
      const studentSchool = student.school?.id ?? student.school ?? student.school_id;
      return Number(studentSchool) === Number(schoolId);
    });
  }, [students, schoolId]);

  const schoolStudentTalents = useMemo(() => {
    return studentTalents.filter((item) => {
      const itemStudentId = Number(typeof item.student === 'number' ? item.student : item.student || 0);
      const studentSchool = item.student_school?.id ?? item.student_school ?? item.student?.school?.id ?? item.student_school_id ??
        (itemStudentId ? students.find((student) => Number(student.id) === itemStudentId)?.school?.id ?? students.find((student) => Number(student.id) === itemStudentId)?.school : undefined);
      return Number(studentSchool) === Number(schoolId);
    });
  }, [studentTalents, students, schoolId]);

  const schoolClubs = useMemo(() => {
    return clubs.filter((club) => Number(club.school) === Number(schoolId) || Number(club.school?.id ?? club.school_id) === Number(schoolId));
  }, [clubs, schoolId]);

  const firstSchoolStudentId = schoolStudents[0]?.id || '';
  const firstSchoolTalentId = schoolStudentTalents[0]?.id || '';
  const firstSchoolClubId = schoolClubs[0]?.id || '';

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const userResponse = await apiService.getCurrentUser();
      const user = userResponse.data;
      setCurrentUser(user);
      const school = user.school;

      const [studentsRes, talentsRes, studentTalentsRes, clubsRes, membershipsRes, evaluationsRes, competitionsRes, resultsRes, criteriaRes] = await Promise.all([
        apiService.getAllStudents({ school }),
        apiService.getTalents(),
        apiService.getStudentTalents({ school }),
        apiService.getClubs({ school }),
        apiService.getClubMemberships({ school }),
        apiService.getEvaluations({ school }),
        apiService.getCompetitions({ school }),
        apiService.getResults({ school }),
        apiService.getEvaluationCriteria(),
      ]);

      setStudents(list(studentsRes));
      setTalents(list(talentsRes));
      setStudentTalents(list(studentTalentsRes));
      setClubs(list(clubsRes));
      setMemberships(list(membershipsRes));
      setEvaluations(list(evaluationsRes));
      setCompetitions(list(competitionsRes));
      setResults(list(resultsRes));
      setCriteria(list(criteriaRes));
      setClubForm((form) => ({ ...form, school: school || '' }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load the school workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const save = async (request, successMessage) => {
    try {
      setSaving(true);
      setError('');
      await request();
      setNotice(successMessage);
      await loadData();
    } catch (err) {
      const details = err.response?.data;
      setError(details?.detail || details?.non_field_errors?.[0] || Object.values(details || {}).flat()[0] || err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitStudent = (event) => {
    event.preventDefault();
    save(async () => {
      const studentResponse = await apiService.createStudent({
        first_name: studentForm.first_name,
        last_name: studentForm.last_name,
        gender: studentForm.gender,
        date_of_birth: studentForm.date_of_birth || null,
        student_id: studentForm.student_id,
        school_id: schoolId,
      });
      await apiService.createUser({
        username: studentForm.student_id,
        password: studentForm.password,
        first_name: studentForm.first_name,
        last_name: studentForm.last_name,
        role: 'student',
        school: schoolId,
        student: studentResponse.data.id,
      });
    }, 'Student registered with login access.').then(() => {
      setStudentForm({ ...emptyStudent });
      setActiveModal(null);
    });
  };

  const submitTalent = (event) => {
    event.preventDefault();
    save(() => apiService.createStudentTalent({ ...talentForm, student: Number(talentForm.student) || null }), 'Talent assigned to student.').then(() => setTalentForm(emptyTalent));
  };

  const submitClub = (event) => {
    event.preventDefault();
    save(() => apiService.createClub({ ...clubForm, school: schoolId }), 'Club created.').then(() => setClubForm({ ...emptyClub, school: schoolId || '' }));
  };

  const submitMembership = (event) => {
    event.preventDefault();
    save(() => apiService.createClubMembership({ ...membershipForm, student: Number(membershipForm.student), club: Number(membershipForm.club), is_active: true }), 'Student assigned to club.').then(() => setMembershipForm(emptyMembership));
  };

  const submitEvaluation = async (event) => {
    event.preventDefault();
    await save(async () => {
      const evaluationResponse = await apiService.createEvaluation({
        student_talent: Number(evaluationForm.studentTalent),
        feedback: evaluationForm.feedback,
      });
      await Promise.all(Object.entries(evaluationForm.criteria).map(([criterion, score]) => (
        score === '' ? Promise.resolve() : apiService.createEvaluationScore({
          evaluation: evaluationResponse.data.id,
          criterion: Number(criterion),
          score: Number(score),
        })
      )));
    }, 'Evaluation recorded.');
    setEvaluationForm(emptyEvaluation);
  };

  const submitSubmission = (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append('student', submissionForm.student);
    data.append('talent', submissionForm.talent);
    data.append('title', submissionForm.title);
    data.append('description', submissionForm.description);
    if (submissionForm.media) data.append('media', submissionForm.media);
    save(() => apiService.createTalentSubmission(data), 'Talent submission uploaded.').then(() => setSubmissionForm({ student: '', talent: '', title: '', description: '', media: null }));
  };

  const submitResult = (event) => {
    event.preventDefault();
    save(async () => {
      const participationResponse = await apiService.createParticipation({
        competition: Number(resultForm.competition),
        student: Number(resultForm.student),
        score: resultForm.score ? Number(resultForm.score) : null,
        status: 'finished',
      });
      await apiService.createResult({
        participation: participationResponse.data.id,
        grade: resultForm.grade || null,
        award: resultForm.award,
        rank: resultForm.rank ? Number(resultForm.rank) : null,
        venue: resultForm.venue,
      });
    }, 'Competition result recorded.').then(() => setResultForm({ student: '', competition: '', score: '', grade: '', award: 'none', rank: '', venue: '' }));
  };

  const selectedStudentTalent = studentTalents.find((item) => item.id === Number(evaluationForm.studentTalent));
  const selectedCriteria = selectedStudentTalent ? criteria.filter((criterion) => Number(criterion.talent) === Number(selectedStudentTalent.talent)) : [];
  const uniqueStudentCount = new Set(studentTalents.map((item) => Number(item.student))).size;
  const medals = results.filter((result) => ['gold', 'silver', 'bronze'].includes(String(result.award || '').toLowerCase())).length;

  useEffect(() => {
    if (!loading && schoolStudents.length && !submissionForm.student) {
      setSubmissionForm((form) => ({ ...form, student: String(firstSchoolStudentId) }));
    }
    if (!loading && schoolStudents.length && !resultForm.student) {
      setResultForm((form) => ({ ...form, student: String(firstSchoolStudentId) }));
    }
    if (!loading && schoolStudents.length && !membershipForm.student) {
      setMembershipForm((form) => ({ ...form, student: String(firstSchoolStudentId) }));
    }
    if (!loading && schoolStudentTalents.length && !evaluationForm.studentTalent) {
      setEvaluationForm((form) => ({ ...form, studentTalent: String(firstSchoolTalentId) }));
    }
    if (!loading && schoolClubs.length && !membershipForm.club) {
      setMembershipForm((form) => ({ ...form, club: String(firstSchoolClubId) }));
    }
    if (!loading && schoolStudents.length && !talentForm.student) {
      setTalentForm((form) => ({ ...form, student: String(firstSchoolStudentId) }));
    }
  }, [loading, schoolStudents, schoolStudentTalents, schoolClubs, submissionForm.student, resultForm.student, membershipForm.student, membershipForm.club, evaluationForm.studentTalent, talentForm.student, firstSchoolStudentId, firstSchoolTalentId, firstSchoolClubId]);

  const studentsSummary = schoolStudents.slice(0, 3);
  const talentsSummary = schoolStudentTalents.slice(0, 3);
  const clubsSummary = schoolClubs.slice(0, 3);
  const competitionsSummary = competitions.slice(0, 3);
  const resultsSummary = results.slice(0, 3);

  const modalTitleMap = {
    studentsAdd: 'Register Student',
    students: 'All Students',
    talents: 'Student Talents',
    clubs: 'School Clubs',
    competitions: 'Competitions',
    results: 'Results',
  };

  return (
    <div className="page-container">
      <Header title="Sport Teacher Workspace" />
      <main className="admin-content">
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
        {notice && <div style={{ padding: '1rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px', marginBottom: '1rem' }}>{notice}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading school workspace...</div>
        ) : (
          <div className="cards-container">
            <section className="admin-section compact-card">
              <div className="section-header">
                <h2>School Overview</h2>
                <p>Live data for {currentUser?.school || 'your school'}</p>
              </div>
              <div className="stats-overview">
                <div className="stat-card"><p className="stat-label">Students</p><h3 className="stat-value">{schoolStudents.length}</h3></div>
                <div className="stat-card"><p className="stat-label">Talents</p><h3 className="stat-value">{schoolStudentTalents.length}</h3></div>
                <div className="stat-card"><p className="stat-label">Clubs</p><h3 className="stat-value">{schoolClubs.length}</h3></div>
                <div className="stat-card"><p className="stat-label">Medals</p><h3 className="stat-value">{medals}</h3></div>
              </div>
            </section>

            <section className="admin-section compact-card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Students ({schoolStudents.length})</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn-action" onClick={() => setActiveModal('studentsAdd')} aria-label="Register student">+</button>
                  <button type="button" className="btn-action" onClick={() => setActiveModal('students')}>View more</button>
                </div>
              </div>
              <div className="report-card">
                {studentsSummary.length > 0 ? (
                  <ul className="report-list">
                    {studentsSummary.map((student) => (
                      <li key={student.id} onClick={() => setActiveModal('students')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveModal('students')}>
                        <span>{student.first_name} {student.last_name}</span>
                        <span>{student.gender || 'N/A'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="simple-list-empty">No students registered</div>
                )}
              </div>
            </section>

            <section className="admin-section compact-card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Talents ({schoolStudentTalents.length})</h2>
                <button type="button" className="btn-action" onClick={() => setActiveModal('talents')}>View more</button>
              </div>
              <div className="report-card">
                {talentsSummary.length > 0 ? (
                  <ul className="report-list">
                    {talentsSummary.map((entry) => (
                      <li key={entry.id} onClick={() => setActiveModal('talents')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveModal('talents')}>
                        <span>{entry.talent_name || entry.talent || 'Talent'}</span>
                        <span>{entry.proficiency_level || 'N/A'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="simple-list-empty">No talents assigned yet</div>
                )}
              </div>
            </section>

            <section className="admin-section compact-card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Clubs ({schoolClubs.length})</h2>
                <button type="button" className="btn-action" onClick={() => setActiveModal('clubs')}>View more</button>
              </div>
              <div className="report-card">
                {clubsSummary.length > 0 ? (
                  <ul className="report-list">
                    {clubsSummary.map((club) => (
                      <li key={club.id} onClick={() => setActiveModal('clubs')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveModal('clubs')}>
                        <span>{club.name}</span>
                        <span>{club.is_active ? 'Active' : 'Inactive'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="simple-list-empty">No clubs found</div>
                )}
              </div>
            </section>

            <section className="admin-section compact-card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Competitions ({competitions.length})</h2>
                <button type="button" className="btn-action" onClick={() => setActiveModal('competitions')}>View more</button>
              </div>
              <div className="report-card">
                {competitionsSummary.length > 0 ? (
                  <ul className="report-list">
                    {competitionsSummary.map((competition) => (
                      <li key={competition.id} onClick={() => setActiveModal('competitions')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveModal('competitions')}>
                        <span>{competition.name}</span>
                        <span>{competition.level || 'N/A'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="simple-list-empty">No competitions assigned</div>
                )}
              </div>
            </section>

            <section className="admin-section compact-card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Results ({results.length})</h2>
                <button type="button" className="btn-action" onClick={() => setActiveModal('results')}>View more</button>
              </div>
              <div className="report-card">
                {resultsSummary.length > 0 ? (
                  <ul className="report-list">
                    {resultsSummary.map((result) => (
                      <li key={result.id} onClick={() => setActiveModal('results')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveModal('results')}>
                        <span>{result.participation_details || 'Result'}</span>
                        <span>{result.grade || '—'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="simple-list-empty">No results recorded</div>
                )}
              </div>
            </section>

            <section className="admin-section compact-card">
              <div className="section-header">
                <h2>Operations</h2>
              </div>
              <div className="reports-grid">
                <form className="report-card" onSubmit={submitStudent}>
                  <h4>Register Student</h4>
                  <input className="form-input" placeholder="First name" value={studentForm.first_name} onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })} required />
                  <input className="form-input" placeholder="Last name" value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} required />
                  <select className="form-input" value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} required>
                    <option value="">Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                  <input className="form-input" type="date" value={studentForm.date_of_birth} onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} />
                  <button type="submit" className="btn-primary" disabled={saving}>Register student</button>
                </form>

                <form className="report-card" onSubmit={submitTalent}>
                  <h4>Assign Talent</h4>
                  <select className="form-input" value={talentForm.student || firstSchoolStudentId} onChange={(e) => setTalentForm({ ...talentForm, student: e.target.value })} required>
                    <option value="">Student</option>
                    {schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}
                  </select>
                  <select className="form-input" value={talentForm.talent} onChange={(e) => setTalentForm({ ...talentForm, talent: e.target.value })} required>
                    <option value="">Talent</option>
                    {talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.name}</option>)}
                  </select>
                  <select className="form-input" value={talentForm.proficiency_level} onChange={(e) => setTalentForm({ ...talentForm, proficiency_level: e.target.value })}>
                    <option value="1">Beginner</option>
                    <option value="2">Intermediate</option>
                    <option value="3">Advanced</option>
                    <option value="4">Expert</option>
                  </select>
                  <input className="form-input" placeholder="Notes" value={talentForm.notes} onChange={(e) => setTalentForm({ ...talentForm, notes: e.target.value })} />
                  <button type="submit" className="btn-primary" disabled={saving}>Assign talent</button>
                </form>

                <form className="report-card" onSubmit={submitClub}>
                  <h4>Create Club</h4>
                  <input className="form-input" placeholder="Club name" value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} required />
                  <input className="form-input" placeholder="Focus" value={clubForm.focus} onChange={(e) => setClubForm({ ...clubForm, focus: e.target.value })} />
                  <textarea className="form-input" placeholder="Description" value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} />
                  <button type="submit" className="btn-primary" disabled={saving}>Create club</button>
                </form>

                <form className="report-card" onSubmit={submitMembership}>
                  <h4>Assign Student to Club</h4>
                  <select className="form-input" value={membershipForm.student || firstSchoolStudentId} onChange={(e) => setMembershipForm({ ...membershipForm, student: e.target.value })} required>
                    <option value="">Student</option>
                    {schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}
                  </select>
                  <select className="form-input" value={membershipForm.club || firstSchoolClubId} onChange={(e) => setMembershipForm({ ...membershipForm, club: e.target.value })} required>
                    <option value="">Club</option>
                    {schoolClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
                  </select>
                  <button type="submit" className="btn-primary" disabled={saving}>Assign to club</button>
                </form>

                <form className="report-card" onSubmit={submitEvaluation}>
                  <h4>Evaluate Talent</h4>
                  <select className="form-input" value={evaluationForm.studentTalent || firstSchoolTalentId} onChange={(e) => setEvaluationForm({ ...evaluationForm, studentTalent: e.target.value, criteria: {} })} required>
                    <option value="">Student talent</option>
                    {schoolStudentTalents.map((item) => <option key={item.id} value={item.id}>{item.student_name || item.student || 'Student'} - {item.talent_name || item.talent || 'Talent'}</option>)}
                  </select>
                  {selectedCriteria.map((criterion) => (
                    <input
                      key={criterion.id}
                      className="form-input"
                      type="number"
                      min="0"
                      max="100"
                      placeholder={`${criterion.name} (${criterion.weight}%)`}
                      value={evaluationForm.criteria[criterion.id] || ''}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, criteria: { ...evaluationForm.criteria, [criterion.id]: e.target.value } })}
                      required
                    />
                  ))}
                  <textarea className="form-input" placeholder="Feedback" value={evaluationForm.feedback} onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })} />
                  <button type="submit" className="btn-primary" disabled={saving || !selectedStudentTalent}>Save evaluation</button>
                </form>

                <form className="report-card" onSubmit={submitSubmission}>
                  <h4>Submit Talent Work</h4>
                  <select className="form-input" value={submissionForm.student || firstSchoolStudentId} onChange={(e) => setSubmissionForm({ ...submissionForm, student: e.target.value })} required>
                    <option value="">Student</option>
                    {schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}
                  </select>
                  <select className="form-input" value={submissionForm.talent} onChange={(e) => setSubmissionForm({ ...submissionForm, talent: e.target.value })} required>
                    <option value="">Talent</option>
                    {talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.name}</option>)}
                  </select>
                  <input className="form-input" placeholder="Submission title" value={submissionForm.title} onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })} required />
                  <textarea className="form-input" placeholder="Description" value={submissionForm.description} onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })} />
                  <input className="form-input" type="file" onChange={(e) => setSubmissionForm({ ...submissionForm, media: e.target.files[0] || null })} />
                  <button type="submit" className="btn-primary" disabled={saving}>Upload submission</button>
                </form>

                <form className="report-card" onSubmit={submitResult}>
                  <h4>Record Competition Result</h4>
                  <select className="form-input" value={resultForm.student || firstSchoolStudentId} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} required>
                    <option value="">Student</option>
                    {schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}
                  </select>
                  <select className="form-input" value={resultForm.competition} onChange={(e) => setResultForm({ ...resultForm, competition: e.target.value })} required>
                    <option value="">Competition</option>
                    {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
                  </select>
                  <input className="form-input" type="number" min="0" max="100" placeholder="Score" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} />
                  <select className="form-input" value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })}>
                    <option value="">Grade</option>
                    {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F'].map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                  <select className="form-input" value={resultForm.award} onChange={(e) => setResultForm({ ...resultForm, award: e.target.value })}>
                    <option value="none">No award</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                  <input className="form-input" type="number" min="1" placeholder="Rank" value={resultForm.rank} onChange={(e) => setResultForm({ ...resultForm, rank: e.target.value })} />
                  <input className="form-input" placeholder="Venue" value={resultForm.venue} onChange={(e) => setResultForm({ ...resultForm, venue: e.target.value })} />
                  <button type="submit" className="btn-primary" disabled={saving}>Record result</button>
                </form>
              </div>
            </section>
          </div>
        )}
      </main>

      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}
        >
          <div className="compact-modal" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '620px', maxHeight: '82vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>{modalTitleMap[activeModal]}</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="modal-close-action" aria-label="Close popup">×</button>
            </div>

            {activeModal === 'studentsAdd' && (
              <form className="report-card" onSubmit={submitStudent}>
                <input className="form-input" placeholder="First name" value={studentForm.first_name} onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })} required />
                <input className="form-input" placeholder="Last name" value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} required />
                <input className="form-input" placeholder="Student ID" value={studentForm.student_id} onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} required />
                <input className="form-input" type="password" placeholder="Student password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} minLength="8" required />
                <select className="form-input" value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} required>
                  <option value="">Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                <input className="form-input" type="date" value={studentForm.date_of_birth} onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} />
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Registering...' : 'Register student'}</button>
              </form>
            )}

            {activeModal === 'students' && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Gender</th><th>DOB</th><th>Student ID</th></tr></thead>
                  <tbody>
                    {schoolStudents.length > 0 ? schoolStudents.map((student) => (
                      <tr key={student.id}><td>{student.first_name} {student.last_name}</td><td>{student.gender || 'N/A'}</td><td>{student.date_of_birth || '—'}</td><td>{student.student_id || 'N/A'}</td></tr>
                    )) : <tr><td colSpan="4">No students found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeModal === 'talents' && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Talent</th><th>Level</th><th>Notes</th></tr></thead>
                  <tbody>
                    {schoolStudentTalents.length > 0 ? schoolStudentTalents.map((entry) => (
                      <tr key={entry.id}><td>{entry.talent_name || entry.talent || 'Talent'}</td><td>{entry.proficiency_level || 'N/A'}</td><td>{entry.notes || '—'}</td></tr>
                    )) : <tr><td colSpan="3">No talents assigned</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeModal === 'clubs' && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Club</th><th>Focus</th><th>Status</th></tr></thead>
                  <tbody>
                    {schoolClubs.length > 0 ? schoolClubs.map((club) => (
                      <tr key={club.id}><td>{club.name}</td><td>{club.focus || 'N/A'}</td><td>{club.is_active ? 'Active' : 'Inactive'}</td></tr>
                    )) : <tr><td colSpan="3">No clubs found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeModal === 'competitions' && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Level</th><th>Status</th></tr></thead>
                  <tbody>
                    {competitions.length > 0 ? competitions.map((competition) => (
                      <tr key={competition.id}><td>{competition.name}</td><td>{competition.level || 'N/A'}</td><td>{competition.status || 'N/A'}</td></tr>
                    )) : <tr><td colSpan="3">No competitions available</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {activeModal === 'results' && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Result</th><th>Grade</th><th>Award</th><th>Rank</th></tr></thead>
                  <tbody>
                    {results.length > 0 ? results.map((result) => (
                      <tr key={result.id}><td>{result.participation_details || 'Result'}</td><td>{result.grade || '—'}</td><td>{result.award || 'none'}</td><td>{result.rank || '—'}</td></tr>
                    )) : <tr><td colSpan="4">No results found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

