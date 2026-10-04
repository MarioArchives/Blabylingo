/* Nicknames: the name a learner picks for the site, shown instead of their Google name.
   A plain script so pages can load it with a script tag; Node tests load it through module.exports. */
const NICKNAME = (() => {
  const NICKNAME_MIN = 2, NICKNAME_MAX = 24;

  // Spaces are tidied first; then any alphabet's letters, digits, spaces, dots, dashes and underscores, starting with a letter or digit
  const cleanNickname = raw => {
    const value = String(raw ?? '').trim().replace(/\s+/g, ' ');
    const fail = error => ({ ok: false, value, error });
    const length = [...value].length;
    if (!length) return fail('Choose a nickname.');
    if (length < NICKNAME_MIN) return fail(`Use at least ${NICKNAME_MIN} characters.`);
    if (length > NICKNAME_MAX) return fail(`Keep it to ${NICKNAME_MAX} characters or fewer.`);
    if (!/^[\p{L}\p{N} ._-]+$/u.test(value)) return fail('Use letters, numbers, spaces, dots, dashes or underscores.');
    if (!/^[\p{L}\p{N}]/u.test(value)) return fail('Start with a letter or a number.');
    return { ok: true, value, error: '' };
  };

  return { cleanNickname, NICKNAME_MIN, NICKNAME_MAX };
})();
if (typeof module !== 'undefined') module.exports = NICKNAME;
