import { useEffect, useMemo, useState } from "react";
import TopHeader from "./TopHeader";
import TopicSidebar from "./TopicSidebar";
import StatsCards from "./StatsCards";
import QuestionList from "./QuestionList";
import QuestionDetail from "./QuestionDetail";
import QuestionInfoPanel from "./QuestionInfoPanel";
import TodayFlashcard from "./TodayFlashcard";
import QuestionEditorModal from "./QuestionEditorModal";
import TopicEditorModal from "./TopicEditorModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import {
  createTopic,
  deleteTopic,
  getAllTopics,
  updateTopic,
} from "../services/topicService";
import {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  toggleFavorite,
  updateQuestion,
} from "../services/questionService";
import {
  filterQuestionsLocally,
  getDashboardStats,
  sortQuestions,
} from "../utils/searchHelpers";

export default function AppShell() {
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics]
  );

  const questionsWithTopicNames = useMemo(
    () =>
      questions.map((question) => ({
        ...question,
        topicName: topicById.get(question.topicId)?.name || "",
      })),
    [questions, topicById]
  );

  const visibleQuestions = useMemo(() => {
    const filtered = filterQuestionsLocally(questionsWithTopicNames, {
      keyword: searchQuery,
      topicId: selectedTopicId,
    });

    return sortQuestions(filtered, sortType);
  }, [questionsWithTopicNames, searchQuery, selectedTopicId, sortType]);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || null,
    [questions, selectedQuestionId]
  );

  const dashboardStats = useMemo(() => {
    const stats = getDashboardStats(topics, questions);
    return {
      ...stats,
      totalQuestions: visibleQuestions.length,
    };
  }, [topics, questions, visibleQuestions.length]);

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setSelectedQuestionId(null);
      return;
    }

    const selectedStillVisible = visibleQuestions.some(
      (question) => question.id === selectedQuestionId
    );

    if (!selectedQuestionId || !selectedStillVisible) {
      setSelectedQuestionId(visibleQuestions[0].id);
    }
  }, [visibleQuestions, selectedQuestionId]);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setAppError("");
      const [loadedTopics, loadedQuestions] = await Promise.all([
        getAllTopics(),
        getAllQuestions(),
      ]);

      setTopics(loadedTopics);
      setQuestions(loadedQuestions);
      setSelectedQuestionId(loadedQuestions[0]?.id || null);
    } catch (error) {
      setAppError(error.message || "Failed to load handbook data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshTopics() {
    const loadedTopics = await getAllTopics();
    setTopics(loadedTopics);
    return loadedTopics;
  }

  async function refreshQuestions(preferredQuestionId) {
    const loadedQuestions = await getAllQuestions();
    setQuestions(loadedQuestions);

    if (preferredQuestionId) {
      setSelectedQuestionId(preferredQuestionId);
    } else if (!loadedQuestions.some((question) => question.id === selectedQuestionId)) {
      setSelectedQuestionId(loadedQuestions[0]?.id || null);
    }

    setRefreshKey((currentKey) => currentKey + 1);
    return loadedQuestions;
  }

  function handleCreateQuestion() {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  }

  function handleEditQuestion(question) {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  }

  async function handleSaveQuestion(questionData) {
    const savedQuestionId = editingQuestion
      ? await updateQuestion(editingQuestion.id, questionData)
      : (await createQuestion(questionData)).id;

    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    await Promise.all([refreshTopics(), refreshQuestions(savedQuestionId)]);
  }

  function handleCreateTopic() {
    setEditingTopic(null);
    setIsTopicModalOpen(true);
  }

  function handleEditTopic(topic) {
    setEditingTopic(topic);
    setIsTopicModalOpen(true);
  }

  async function handleSaveTopic(topicData) {
    if (editingTopic) {
      await updateTopic(editingTopic.id, topicData);
    } else {
      await createTopic(topicData);
    }

    setIsTopicModalOpen(false);
    setEditingTopic(null);
    await refreshTopics();
  }

  async function handleDeleteTopic(topic) {
    await deleteTopic(topic.id);
    if (selectedTopicId === topic.id) {
      setSelectedTopicId(null);
    }
    setIsTopicModalOpen(false);
    setEditingTopic(null);
    await refreshTopics();
  }

  function handleDeleteQuestion(question) {
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  }

  async function handleConfirmDeleteQuestion() {
    if (!questionToDelete) {
      return;
    }

    await deleteQuestion(questionToDelete.id);
    setIsDeleteModalOpen(false);
    setQuestionToDelete(null);
    await Promise.all([refreshTopics(), refreshQuestions()]);
  }

  async function handleToggleFavorite(question) {
    await toggleFavorite(question.id, question.isFavorite);
    await refreshQuestions(question.id);
  }

  async function handleReviewUpdated() {
    await refreshQuestions(selectedQuestionId);
  }

  return (
    <div className="app-shell">
      <TopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewQuestion={handleCreateQuestion}
      />

      <div className="main-layout">
        <TopicSidebar
          topics={topics}
          questions={questions}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          onNewTopic={handleCreateTopic}
          onEditTopic={handleEditTopic}
        />

        <main className="content-area">
          {appError && <div className="app-alert">{appError}</div>}
          <StatsCards stats={dashboardStats} />

          <div className="work-area">
            <QuestionList
              questions={visibleQuestions}
              topics={topics}
              selectedQuestionId={selectedQuestionId}
              searchQuery={searchQuery}
              sortType={sortType}
              isLoading={isLoading}
              onSortChange={setSortType}
              onSelectQuestion={setSelectedQuestionId}
              onToggleFavorite={handleToggleFavorite}
              onNewQuestion={handleCreateQuestion}
            />

            <QuestionDetail
              question={selectedQuestion}
              topic={selectedQuestion ? topicById.get(selectedQuestion.topicId) : null}
              onNewQuestion={handleCreateQuestion}
              onEditQuestion={handleEditQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onToggleFavorite={handleToggleFavorite}
            />

            <aside className="right-panel">
              <QuestionInfoPanel
                question={selectedQuestion}
                topic={selectedQuestion ? topicById.get(selectedQuestion.topicId) : null}
              />
              <TodayFlashcard refreshKey={refreshKey} onReviewed={handleReviewUpdated} />
            </aside>
          </div>
        </main>
      </div>

      <QuestionEditorModal
        isOpen={isQuestionModalOpen}
        question={editingQuestion}
        topics={topics}
        selectedTopicId={selectedTopicId}
        onClose={() => setIsQuestionModalOpen(false)}
        onSave={handleSaveQuestion}
      />

      <TopicEditorModal
        isOpen={isTopicModalOpen}
        topic={editingTopic}
        onClose={() => setIsTopicModalOpen(false)}
        onSave={handleSaveTopic}
        onDelete={handleDeleteTopic}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete this note?"
        message="This action cannot be undone."
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteQuestion}
      />
    </div>
  );
}
