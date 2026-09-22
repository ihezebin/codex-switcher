import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Input, List, Popconfirm, Skeleton, Tag, Typography, message } from "antd";
import { CommentOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

function formatDate(value: string, language: "zh" | "en") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeDate(value: string, language: "zh" | "en") {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return formatDate(value, language);
  const hours = Math.max(1, Math.floor(elapsed / 3_600_000));
  if (elapsed < 86_400_000) return language === "zh" ? `${hours} 小时前` : `${hours}h ago`;
  const days = Math.floor(elapsed / 86_400_000);
  if (days < 7) return language === "zh" ? `${days} 天前` : `${days}d ago`;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function SessionManager({ language }: { language: "zh" | "en" }) {
  const zh = language === "zh";
  const [sessions, setSessions] = useState<CodexSessionSummary[]>([]);
  const [selected, setSelected] = useState<CodexSessionDetail>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [query, setQuery] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const loadDetail = useCallback(async (file: string) => {
    setDetailLoading(true);
    try { setSelected(await window.codexAPI.getSession(file)); }
    catch (error) { messageApi.error((error as Error).message); }
    finally { setDetailLoading(false); }
  }, [messageApi]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await window.codexAPI.listSessions();
      setSessions(next);
      if (next.length) await loadDetail(next[0].file); else setSelected(undefined);
    } catch (error) { messageApi.error((error as Error).message); }
    finally { setLoading(false); }
  }, [loadDetail, messageApi]);

  useEffect(() => { void load(); }, [load]);

  const filtered = sessions.filter((session) =>
    `${session.title} ${session.cwd} ${session.model}`.toLowerCase().includes(query.toLowerCase()),
  );

  const remove = async (file: string) => {
    try {
      await window.codexAPI.deleteSession(file);
      const next = sessions.filter((item) => item.file !== file);
      setSessions(next);
      if (selected?.file === file) {
        if (next.length) await loadDetail(next[0].file); else setSelected(undefined);
      }
      messageApi.success(zh ? "会话已删除" : "Session deleted");
    } catch (error) { messageApi.error((error as Error).message); }
  };

  const resume = async (file: string) => {
    setResuming(true);
    try {
      await window.codexAPI.resumeSession(file);
      messageApi.success(zh ? "已在终端中恢复会话" : "Session resumed in Terminal");
    } catch (error) { messageApi.error((error as Error).message); }
    finally { setResuming(false); }
  };

  return (
    <div className="session-manager">
      {contextHolder}
      <aside className="session-list-pane">
        <div className="session-list-header">
          <div><Title level={4}>{zh ? "会话列表" : "Sessions"}</Title>{!loading && <Tag>{sessions.length}</Tag>}</div>
          <Button type="text" icon={<ReloadOutlined />} onClick={() => void load()} />
        </div>
        <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={zh ? "搜索会话" : "Search sessions"} />
        <div className="session-list-scroll">
          {loading ? <Skeleton active title={false} paragraph={{ rows: 9 }} /> : (
            <List dataSource={filtered} locale={{ emptyText: <Empty description={zh ? "暂无会话" : "No sessions"} /> }} renderItem={(session) => (
              <List.Item className={`session-list-item ${selected?.file === session.file ? "selected" : ""}`} onClick={() => void loadDetail(session.file)}>
                <div className="session-item-copy">
                  <Text strong ellipsis>{session.title}</Text>
                  <Text type="secondary">{formatRelativeDate(session.updatedAt, language)} · {session.messageCount} {zh ? "条消息" : "messages"}</Text>
                </div>
              </List.Item>
            )} />
          )}
        </div>
      </aside>
      <main className="session-detail-pane">
        {loading || detailLoading ? <Skeleton active paragraph={{ rows: 12 }} /> : selected ? (
          <>
            <header className="session-detail-header">
              <div>
                <Title level={3} ellipsis={{ tooltip: selected.title }}>{selected.title}</Title>
                <div className="session-meta"><span>{formatDate(selected.createdAt, language)}</span>{selected.model && <Tag color="blue">{selected.model}</Tag>}</div>
                <Text className="session-project" ellipsis={{ tooltip: selected.cwd || "-" }}>{selected.cwd || "-"}</Text>
                <Text className="session-file" ellipsis={{ tooltip: selected.file }}>{selected.file}</Text>
              </div>
              <div className="session-detail-actions">
                <Button type="primary" icon={<PlayCircleOutlined />} loading={resuming} onClick={() => void resume(selected.file)}>{zh ? "恢复会话" : "Resume"}</Button>
                <Popconfirm title={zh ? "确定删除这个会话吗？" : "Delete this session?"} description={zh ? "此操作会永久删除对应的 JSONL 文件。" : "The JSONL file will be permanently deleted."} okText={zh ? "删除" : "Delete"} cancelText={zh ? "取消" : "Cancel"} okButtonProps={{ danger: true }} onConfirm={() => remove(selected.file)}>
                  <Button danger icon={<DeleteOutlined />}>{zh ? "删除会话" : "Delete"}</Button>
                </Popconfirm>
              </div>
            </header>
            <div className="conversation-title"><CommentOutlined /><Title level={4}>{zh ? "对话记录" : "Conversation"}</Title></div>
            <div className="conversation-scroll">
              {selected.messages.map((item, index) => (
                <article className={`conversation-message ${item.role}`} key={`${item.timestamp}-${index}`}>
                  <div className="conversation-message-head"><strong>{item.role === "user" ? (zh ? "用户" : "User") : "Codex"}</strong><span>{formatDate(item.timestamp, language)}</span></div>
                  <pre>{item.content}</pre>
                </article>
              ))}
            </div>
          </>
        ) : <Empty description={zh ? "请选择一个会话" : "Select a session"} />}
      </main>
    </div>
  );
}
