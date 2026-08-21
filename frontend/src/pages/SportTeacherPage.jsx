import { useEffect, useState } from 'react';
import { Header } from '../components/shared';
import * as apiService from '../services/apiService';
import '../styles/dashboard.css';
import '../styles/talentadmin.css';

const emptyStudent = { first_name: '', last_name: '', gender: '', date_of_birth: '', school_id: '' };
const emptyTalent = { student: '', talent: '', proficiency_level: 1, notes: '' };
const emptyClub = { name: '', focus: '', description: '', school: '' };
const emptyMembership = { student: '', club: '' };
const emptyEvaluation = { studentTalent: '', criteria: {}, feedback: '' };

const list = (response) => response.data.results || [];

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

  const schoolId = currentUser?.school;
  const schoolStudents = students.filter((student) => {
    const studentSchool = student.school?.id ?? student.school ?? student.school_id;
    return studentSchool === schoolId;
  });
  const schoolStudentTalents = studentTalents.filter((item) => {
    const itemStudentSchool = item.student_school?.id ?? item.student_school ?? item.student?.school?.id ?? item.student_school_id;
    return itemStudentSchool === schoolId;
  });
  const schoolClubs = clubs.filter((club) => club.school === schoolId || club.school?.id === schoolId);
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
        apiService.getStudents({ school }),
        apiService.getTalents(),
        apiService.getStudentTalents(),
        apiService.getClubs({ school }),
        apiService.getClubMemberships(),
        apiService.getEvaluations(),
        apiService.getCompetitions(),
        apiService.getResults(),
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
    save(() => apiService.createStudent({ ...studentForm, school_id: schoolId }), 'Student registered.').then(() => setStudentForm(emptyStudent));
  };

  const submitTalent = (event) => {
    event.preventDefault();
    save(() => apiService.createStudentTalent(talentForm), 'Talent assigned to student.').then(() => setTalentForm(emptyTalent));
  };

  const submitClub = (event) => {
    event.preventDefault();
    save(() => apiService.createClub({ ...clubForm, school: schoolId }), 'Club created.').then(() => setClubForm({ ...emptyClub, school: schoolId || '' }));
  };

  const submitMembership = (event) => {
    event.preventDefault();
    save(() => apiService.createClubMembership({ ...membershipForm, is_active: true }), 'Student assigned to club.').then(() => setMembershipForm(emptyMembership));
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
  const selectedCriteria = selectedStudentTalent ? criteria.filter((criterion) => criterion.talent === selectedStudentTalent.talent) : [];
  const uniqueStudentCount = new Set(studentTalents.map((item) => item.student)).size;
  const medals = results.filter((result) => ['gold', 'silver', 'bronze'].includes(result.award)).length;

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
  }, [loading, schoolStudents, schoolStudentTalents, schoolClubs, submissionForm.student, resultForm.student, membershipForm.student, membershipForm.club, evaluationForm.studentTalent, talentForm.student]);

  return (
    <div className="page-container">
      <Header title="Sport Teacher Workspace" />
      <main className="admin-content">
        {error && <div className="error-message" style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
        {notice && <div style={{ padding: '1rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px', marginBottom: '1rem' }}>{notice}</div>}
        {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Loading school workspace...</div> : (
          <div className="cards-container">
            <section className="admin-section">
              <div className="section-header"><h2>School Overview</h2><p>Live data for {currentUser?.school || 'your school'}</p></div>
              <div className="stats-overview">
                <div className="stat-card"><p className="stat-label">Students with talents</p><h3 className="stat-value">{uniqueStudentCount}</h3></div>
                <div className="stat-card"><p className="stat-label">Clubs</p><h3 className="stat-value">{clubs.length}</h3></div>
                <div className="stat-card"><p className="stat-label">Competitions</p><h3 className="stat-value">{competitions.length}</h3></div>
                <div className="stat-card"><p className="stat-label">Medals</p><h3 className="stat-value">{medals}</h3></div>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Talent Submissions</h2><p>Upload a student performance or creative submission.</p></div>
              <form className="report-card" onSubmit={submitSubmission}>
                <select className="form-input" value={submissionForm.student || firstSchoolStudentId} onChange={(e) => setSubmissionForm({ ...submissionForm, student: e.target.value })} required><option value="">Student</option>{schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}</select>
                <select className="form-input" value={submissionForm.talent} onChange={(e) => setSubmissionForm({ ...submissionForm, talent: e.target.value })} required><option value="">Talent</option>{talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.name}</option>)}</select>
                <input className="form-input" placeholder="Submission title" value={submissionForm.title} onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })} required />
                <textarea className="form-input" placeholder="Description" value={submissionForm.description} onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })} />
                <input className="form-input" type="file" onChange={(e) => setSubmissionForm({ ...submissionForm, media: e.target.files[0] || null })} />
                <button className="btn-primary" disabled={saving}>Upload submission</button>
              </form>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Record Competition Result</h2><p>Register participation and record the final result.</p></div>
              <form className="report-card" onSubmit={submitResult}>
                <select className="form-input" value={resultForm.student || firstSchoolStudentId} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} required><option value="">Student</option>{schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}</select>
                <select className="form-input" value={resultForm.competition} onChange={(e) => setResultForm({ ...resultForm, competition: e.target.value })} required><option value="">Competition</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select>
                <input className="form-input" type="number" min="0" max="100" placeholder="Score" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} />
                <select className="form-input" value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })}><option value="">Grade</option>{['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select>
                <select className="form-input" value={resultForm.award} onChange={(e) => setResultForm({ ...resultForm, award: e.target.value })}><option value="none">No award</option><option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option></select>
                <input className="form-input" type="number" min="1" placeholder="Rank" value={resultForm.rank} onChange={(e) => setResultForm({ ...resultForm, rank: e.target.value })} />
                <input className="form-input" placeholder="Venue" value={resultForm.venue} onChange={(e) => setResultForm({ ...resultForm, venue: e.target.value })} />
                <button className="btn-primary" disabled={saving}>Record result</button>
              </form>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Register Student</h2><p>Add a student to your school.</p></div>
              <form className="reports-grid" onSubmit={submitStudent}>
                <input className="form-input" placeholder="First name" value={studentForm.first_name} onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })} required />
                <input className="form-input" placeholder="Last name" value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} required />
                <select className="form-input" value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} required><option value="">Gender</option><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select>
                <input className="form-input" type="date" value={studentForm.date_of_birth} onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} />
                <button className="btn-primary" disabled={saving}>Register student</button>
              </form>

              <div className="table-container" style={{ marginTop: '1.5rem' }}>
                <h3>Students in your school</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Date of birth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}</td>
                        <td>{student.date_of_birth || '—'}</td>
                      </tr>
                    ))}
                    {schoolStudents.length === 0 && (
                      <tr><td colSpan="3">No students registered for this school yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Assign Talent</h2><p>Assign up to five talents to each student.</p></div>
              <form className="reports-grid" onSubmit={submitTalent}>
                <select className="form-input" value={talentForm.student || firstSchoolStudentId} onChange={(e) => setTalentForm({ ...talentForm, student: e.target.value })} required><option value="">Student</option>{schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}</select>
                <select className="form-input" value={talentForm.talent} onChange={(e) => setTalentForm({ ...talentForm, talent: e.target.value })} required><option value="">Talent</option>{talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.name}</option>)}</select>
                <select className="form-input" value={talentForm.proficiency_level} onChange={(e) => setTalentForm({ ...talentForm, proficiency_level: e.target.value })}><option value="1">Beginner</option><option value="2">Intermediate</option><option value="3">Advanced</option><option value="4">Expert</option></select>
                <input className="form-input" placeholder="Progress notes" value={talentForm.notes} onChange={(e) => setTalentForm({ ...talentForm, notes: e.target.value })} />
                <button className="btn-primary" disabled={saving}>Assign talent</button>
              </form>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Club Management</h2><p>Create clubs and assign students to one active club.</p></div>
              <div className="reports-grid">
                <form className="report-card" onSubmit={submitClub}><h4>Create club</h4><input className="form-input" placeholder="Club name" value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} required /><input className="form-input" placeholder="Focus" value={clubForm.focus} onChange={(e) => setClubForm({ ...clubForm, focus: e.target.value })} /><button className="btn-primary" disabled={saving}>Create club</button></form>
                <form className="report-card" onSubmit={submitMembership}><h4>Assign student</h4><select className="form-input" value={membershipForm.student || firstSchoolStudentId} onChange={(e) => setMembershipForm({ ...membershipForm, student: e.target.value })} required><option value="">Student</option>{schoolStudents.map((student) => <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>)}</select><select className="form-input" value={membershipForm.club || firstSchoolClubId} onChange={(e) => setMembershipForm({ ...membershipForm, club: e.target.value })} required><option value="">Club</option>{schoolClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select><button className="btn-primary" disabled={saving}>Assign to club</button></form>
              </div>
              <div className="table-container"><table className="data-table"><thead><tr><th>Club</th><th>Focus</th><th>Status</th></tr></thead><tbody>{schoolClubs.map((club) => <tr key={club.id}><td>{club.name}</td><td>{club.focus || 'N/A'}</td><td>{club.is_active ? 'Active' : 'Inactive'}</td></tr>)}{schoolClubs.length === 0 && <tr><td colSpan="3">No clubs found</td></tr>}</tbody></table></div>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Evaluate Talent</h2><p>Score criteria from 0 to 100. The backend calculates grade and pass status.</p></div>
              <form className="report-card" onSubmit={submitEvaluation}>
                <select className="form-input" value={evaluationForm.studentTalent || firstSchoolTalentId} onChange={(e) => setEvaluationForm({ ...evaluationForm, studentTalent: e.target.value, criteria: {} })} required><option value="">Student talent</option>{schoolStudentTalents.map((item) => <option key={item.id} value={item.id}>{item.student_name} - {item.talent_name}</option>)}</select>
                {selectedCriteria.map((criterion) => <input key={criterion.id} className="form-input" type="number" min="0" max="100" placeholder={`${criterion.name} (${criterion.weight}%)`} value={evaluationForm.criteria[criterion.id] || ''} onChange={(e) => setEvaluationForm({ ...evaluationForm, criteria: { ...evaluationForm.criteria, [criterion.id]: e.target.value } })} required />)}
                <textarea className="form-input" placeholder="Feedback" value={evaluationForm.feedback} onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })} />
                <button className="btn-primary" disabled={saving || !selectedStudentTalent}>Save evaluation</button>
              </form>
            </section>

            <section className="admin-section">
              <div className="section-header"><h2>Students and Results</h2><p>Current school records.</p></div>
              <div className="table-container"><table className="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>School</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.first_name} {student.last_name}</td><td>{student.student_id || 'N/A'}</td><td>{student.school?.name || 'Current school'}</td></tr>)}{students.length === 0 && <tr><td colSpan="3">No students found</td></tr>}</tbody></table></div>
              <div className="table-container"><table className="data-table"><thead><tr><th>Competition</th><th>Grade</th><th>Award</th><th>Rank</th></tr></thead><tbody>{results.map((result) => <tr key={result.id}><td>{result.participation_details}</td><td>{result.grade || 'N/A'}</td><td>{result.award}</td><td>{result.rank || 'N/A'}</td></tr>)}{results.length === 0 && <tr><td colSpan="4">No results found</td></tr>}</tbody></table></div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
