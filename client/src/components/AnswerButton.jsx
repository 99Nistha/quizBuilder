// An answer in a trivia or personality quiz, with its picture if it has one.
export default function AnswerButton({ answer, className = '', ...props }) {
  return (
    <button className={`answer ${answer.image ? 'answer-pic' : ''} ${className}`} {...props}>
      {answer.image && <img src={answer.image} alt="" loading="lazy" />}
      <span>{answer.label}</span>
    </button>
  );
}
