import { getDateMillis } from "./dateHelpers";

// Normalizes text before search comparisons.
export function normalizeText(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

// Converts comma strings or arrays into lowercase unique tag arrays.
export function normalizeTags(tags) {
  const tagList = Array.isArray(tags) ? tags : (tags || "").split(",");

  return [
    ...new Set(
      tagList
        .map((tag) => normalizeText(tag).replace(/^#+/, ""))
        .filter(Boolean)
    ),
  ];
}

// Removes common Markdown formatting for readable previews.
export function stripMarkdown(markdown) {
  return (markdown || "")
    .replace(/```[\s\S]*?```/g, (codeBlock) =>
      codeBlock.replace(/```[a-zA-Z0-9_-]*\n?/g, "").replace(/```/g, "")
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[>_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Builds a short plain-text answer preview.
export function getQuestionPreview(answerMarkdown, maxLength = 140) {
  const plainText = stripMarkdown(answerMarkdown);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}

// Applies the UI's search and filter controls to an in-memory question list.
export function filterQuestionsLocally(questions, options = {}) {
  const keyword = normalizeText(options.keyword);
  const tag = normalizeText(options.tag).replace(/^#+/, "");

  return questions.filter((question) => {
    const normalizedTags = normalizeTags(question.tags || []);
    const matchesKeyword =
      !keyword ||
      normalizeText(question.title).includes(keyword) ||
      normalizeText(question.answerMarkdown).includes(keyword) ||
      normalizeText(question.topicName).includes(keyword) ||
      normalizeText(question.difficulty).includes(keyword) ||
      normalizeText(question.status).includes(keyword) ||
      normalizedTags.some((questionTag) => questionTag.includes(keyword));

    const matchesTopic = !options.topicId || question.topicId === options.topicId;
    const matchesStatus = !options.status || question.status === options.status;
    const matchesTag = !tag || normalizedTags.includes(tag);
    const matchesFavorite = !options.onlyFavorites || question.isFavorite === true;
    const matchesFlashcard =
      !options.onlyFlashcards || question.isFlashcard === true;

    return (
      matchesKeyword &&
      matchesTopic &&
      matchesStatus &&
      matchesTag &&
      matchesFavorite &&
      matchesFlashcard
    );
  });
}

// Sorts question lists for common UI modes.
export function sortQuestions(questions, sortType = "updated") {
  return [...questions].sort((firstQuestion, secondQuestion) => {
    if (sortType === "newest") {
      return (
        getDateMillis(secondQuestion.createdAt) -
        getDateMillis(firstQuestion.createdAt)
      );
    }

    if (sortType === "oldest") {
      return (
        getDateMillis(firstQuestion.createdAt) -
        getDateMillis(secondQuestion.createdAt)
      );
    }

    if (sortType === "title") {
      return (firstQuestion.title || "").localeCompare(secondQuestion.title || "");
    }

    if (sortType === "review_due") {
      return (
        getDateMillis(firstQuestion.nextReviewAt) -
        getDateMillis(secondQuestion.nextReviewAt)
      );
    }

    return (
      getDateMillis(secondQuestion.updatedAt) -
      getDateMillis(firstQuestion.updatedAt)
    );
  });
}

// Calculates counts for dashboard summary cards.
export function getDashboardStats(topics, questions) {
  return {
    totalCategories: topics.length,
    totalQuestions: questions.length,
    totalFavorites: questions.filter((question) => question.isFavorite === true)
      .length,
    totalNeedReview: questions.filter(
      (question) => question.status === "need_review"
    ).length,
    totalFlashcards: questions.filter((question) => question.isFlashcard === true)
      .length,
  };
}
