"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, Clock, CheckCircle, MessageCircle, X, Trash2, User } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

type Contact = {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: "pending" | "read" | "replied" | "closed";
    user_id: string | null;
    created_at: string;
};

const statusConfig = {
    pending: { label: "未読", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
    read: { label: "確認済", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle },
    replied: { label: "返信済", color: "bg-green-500/20 text-green-400", icon: MessageCircle },
    closed: { label: "完了", color: "bg-slate-500/20 text-slate-400", icon: X },
};

export default function AdminContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending">("all");
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);
    const [contactToDelete, setContactToDelete] = useState<number | null>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/contacts");
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        }
        setLoading(false);
    };

    const updateStatus = async (id: number, status: Contact["status"]) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/admin/contacts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setContacts(contacts.map(c => c.id === id ? { ...c, status } : c));
                if (selectedContact?.id === id) {
                    setSelectedContact({ ...selectedContact, status });
                }
            }
        } catch (error) {
            console.error("Failed to update contact:", error);
        }
        setUpdating(null);
    };

    const handleDeleteClick = (id: number) => {
        setContactToDelete(id);
    };

    const deleteContact = async () => {
        if (!contactToDelete) return;

        try {
            const res = await fetch(`/api/admin/contacts/${contactToDelete}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setContacts(contacts.filter(c => c.id !== contactToDelete));
                if (selectedContact?.id === contactToDelete) {
                    setSelectedContact(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete contact:", error);
        }
        setContactToDelete(null);
    };

    const filteredContacts = filter === "pending"
        ? contacts.filter(c => c.status === "pending")
        : contacts;

    const pendingCount = contacts.filter(c => c.status === "pending").length;

    return (
        <>
            <main className="min-h-screen bg-slate-900 text-white">
                {/* Header */}
                <div className="bg-slate-800/50 border-b border-slate-700">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-400" />
                                    お問い合わせ管理
                                </h1>
                                {pendingCount > 0 && (
                                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full">
                                        {pendingCount}件未読
                                    </span>
                                )}
                            </div>

                            {/* Filter */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all"
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    すべて ({contacts.length})
                                </button>
                                <button
                                    onClick={() => setFilter("pending")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "pending"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    未読 ({pendingCount})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            {filter === "pending" ? "未読のお問い合わせはありません" : "お問い合わせはありません"}
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Contact List */}
                            <div className="space-y-4">
                                {filteredContacts.map((contact) => {
                                    const status = statusConfig[contact.status];
                                    const StatusIcon = status.icon;

                                    return (
                                        <div
                                            key={contact.id}
                                            onClick={() => {
                                                setSelectedContact(contact);
                                                if (contact.status === "pending") {
                                                    updateStatus(contact.id, "read");
                                                }
                                            }}
                                            className={`p-4 bg-slate-800/50 border rounded-xl cursor-pointer transition-all ${selectedContact?.id === contact.id
                                                ? "border-yellow-500/50 bg-slate-800"
                                                : "border-slate-700/50 hover:border-slate-600"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {status.label}
                                                        </span>
                                                        {contact.user_id && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                                                                <User className="w-3 h-3" />
                                                                会員
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-medium text-white truncate">
                                                        {contact.subject}
                                                    </h3>
                                                    <p className="text-sm text-slate-400 truncate">
                                                        {contact.name} &lt;{contact.email}&gt;
                                                    </p>
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(contact.created_at).toLocaleDateString("ja-JP", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Contact Detail */}
                            <div className="lg:sticky lg:top-24 h-fit">
                                {selectedContact ? (
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                                        {/* Detail Header */}
                                        <div className="p-4 border-b border-slate-700/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <h2 className="text-lg font-bold">{selectedContact.subject}</h2>
                                                <button
                                                    onClick={() => handleDeleteClick(selectedContact.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="削除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                <span className="font-medium text-white">{selectedContact.name}</span>
                                                <span className="mx-2">&lt;{selectedContact.email}&gt;</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {new Date(selectedContact.created_at).toLocaleString("ja-JP")}
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <div className="p-4 min-h-[200px]">
                                            <p className="text-slate-300 whitespace-pre-wrap">
                                                {selectedContact.message}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                                            <div className="flex flex-wrap gap-2">
                                                {(["pending", "read", "replied", "closed"] as const).map((status) => {
                                                    const config = statusConfig[status];
                                                    const StatusIcon = config.icon;
                                                    const isActive = selectedContact.status === status;

                                                    return (
                                                        <button
                                                            key={status}
                                                            onClick={() => updateStatus(selectedContact.id, status)}
                                                            disabled={updating === selectedContact.id}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${isActive
                                                                ? config.color
                                                                : "bg-slate-700/50 text-slate-400 hover:text-white"
                                                                }`}
                                                        >
                                                            <StatusIcon className="w-4 h-4" />
                                                            {config.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-8 text-center text-slate-500">
                                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>お問い合わせを選択してください</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={contactToDelete !== null}
                title="お問い合わせを削除"
                message="このお問い合わせを削除しますか？"
                onConfirm={deleteContact}
                onCancel={() => setContactToDelete(null)}
                confirmText="削除する"
                cancelText="キャンセル"
                danger={true}
            />
        </>
    );
}
