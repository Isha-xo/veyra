
function LanguageSelector({ language, onLanguageChange }) {
  return (
    <div className="language-selector">
      <label htmlFor="language">Select language</label>

      <select
        id="language"
        value={language}
        onChange={(event) => onLanguageChange(event.target.value)}
      >
        <option value="">Auto Detect</option>
        <option value="en">English</option>
        <option value="hi">Hindi</option>
      </select>
    </div>
  );
}

export default LanguageSelector;
