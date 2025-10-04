import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
	{
		id: 1,
		question: 'When you create/enjoy art, what drives you most?',
		options: [
			'To express my inner feelings',
			'To master technique and skill',
			'To challenge norms and innovate',
			'To connect and share with others',
		],
	},
	{
		id: 2,
		question: 'Which type of art do you find most powerful?',
		options: [
			'Harmonious & Classical',
			'Intense & Expressive',
			'Experimental & Abstract',
			'Narrative & Story-driven',
		],
	},
	{
		id: 3,
		question: 'In the art world, I see myself most as...',
		options: [
			'A maker (I create things)',
			'A critic (I analyze and evaluate)',
			'A curator (I collect and organize)',
			'An appreciator (I enjoy)',
		],
	},
	{
		id: 4,
		question: 'Do you have a preference over genre of music?',
		options: [
			'Classical, Jazz & Instrumental',
			'R&B, Pop & Modern',
			'Rock, Disco & Funk',
			'Acoustic, Folk & Country',
		],
	},
];

const INTERESTS = [
	'concerts',
	'museum',
	'gallery',
	'improv',
	'composer-talks',
	'open-mic',
	'experimental',
];
const GENRES = [
	'rock',
	'jazz',
	'classical',
	'edm',
	'world',
	'folk',
	'hiphop',
	'pop',
];
const SLOTS = [
	'Mon 18:00',
	'Tue 18:00',
	'Wed 18:00',
	'Thu 18:00',
	'Fri 18:00',
	'Sat 14:00',
	'Sun 14:00',
];

export default function Quiz() {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [responses, setResponses] = useState([]);
	const [interests, setInterests] = useState([]);
	const [genres, setGenres] = useState([]);
	const [availability, setAvailability] = useState(['Fri 18:00', 'Sat 14:00']);
	const [location, setLocation] = useState('Campus');
	const [values, setValues] = useState(['community', 'experimental']);
	const [msg, setMsg] = useState('');
	const navigate = useNavigate();

	const handleAnswer = (answer) => {
		setResponses([
			...responses,
			{ question: QUESTIONS[currentQuestionIndex].question, answer },
		]);
		setCurrentQuestionIndex(currentQuestionIndex + 1);
	};

	const toggle = (arr, setArr, v) =>
		setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

	async function submit() {
		try {
			const { data } = await api.post('/quiz', {
				responses,
				interests,
				genres,
				availability,
				location,
				values,
			});
			setMsg('Saved! Profile updated.');
			setTimeout(() => navigate('/dashboard'), 600);
		} catch (e) {
			setMsg('Failed: ' + (e?.response?.data?.error || 'server error'));
		}
	}

	return (
		<div className="card">
			<h2>Artist Quiz</h2>
			{currentQuestionIndex < QUESTIONS.length ? (
				<div>
					<h4>{QUESTIONS[currentQuestionIndex].question}</h4>
					{QUESTIONS[currentQuestionIndex].options.map((option) => (
						<button key={option} onClick={() => handleAnswer(option)}>
							{option}
						</button>
					))}
				</div>
			) : (
				<div>
					<div className="row">
						<div className="col">
							<h4>Interests</h4>
							{INTERESTS.map((i) => (
								<label key={i} className="small">
									<input
										type="checkbox"
										checked={interests.includes(i)}
										onChange={() => toggle(interests, setInterests, i)}
									/>{' '}
									{i}
								</label>
							))}
						</div>
						<div className="col">
							<h4>Genres</h4>
							{GENRES.map((i) => (
								<label key={i} className="small">
									<input
										type="checkbox"
										checked={genres.includes(i)}
										onChange={() => toggle(genres, setGenres, i)}
									/>{' '}
									{i}
								</label>
							))}
						</div>
						<div className="col">
							<h4>Availability</h4>
							{SLOTS.map((i) => (
								<label key={i} className="small">
									<input
										type="checkbox"
										checked={availability.includes(i)}
										onChange={() => toggle(availability, setAvailability, i)}
									/>{' '}
									{i}
								</label>
							))}
							<h4>Location</h4>
							<input
								value={location}
								onChange={(e) => setLocation(e.target.value)}
							/>
							<h4>Values (freeform tags)</h4>
							<input
								value={values.join(',')}
								onChange={(e) =>
									setValues(
										e.target.value
											.split(',')
											.map((x) => x.trim())
											.filter(Boolean)
									)
								}
							/>
						</div>
					</div>
					<div style={{ marginTop: 12 }}>
						<button onClick={submit}>Submit Quiz</button>
						{msg && (
							<span className="small" style={{ marginLeft: 12 }}>
								{msg}
							</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}


