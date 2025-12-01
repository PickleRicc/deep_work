'use client'

import { useState, useEffect } from 'react'
import { Task, Project } from '@/lib/types/database'

interface PendingReview {
    item: Task | Project
    itemType: 'task' | 'project'
    timestamp: number
}

export function useReviewPrompt() {
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [currentReview, setCurrentReview] = useState<PendingReview | null>(null)

    // Load pending reviews from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('pending_reviews')
        if (stored) {
            try {
                const reviews = JSON.parse(stored)
                setPendingReviews(reviews)
            } catch (e) {
                console.error('Failed to load pending reviews:', e)
            }
        }
    }, [])

    // Save pending reviews to localStorage whenever they change
    useEffect(() => {
        if (pendingReviews.length > 0) {
            localStorage.setItem('pending_reviews', JSON.stringify(pendingReviews))
        } else {
            localStorage.removeItem('pending_reviews')
        }
    }, [pendingReviews])

    const addPendingReview = (item: Task | Project, itemType: 'task' | 'project') => {
        const newReview: PendingReview = {
            item,
            itemType,
            timestamp: Date.now()
        }

        setPendingReviews(prev => [...prev, newReview])

        // Show review modal after 2 seconds (non-blocking)
        setTimeout(() => {
            setCurrentReview(newReview)
            setShowReviewModal(true)
        }, 2000)
    }

    const skipReview = () => {
        setShowReviewModal(false)
        setCurrentReview(null)
        // Review remains in pendingReviews for later
    }

    const completeReview = (item: Task | Project) => {
        // Remove the reviewed item from pending reviews
        setPendingReviews(prev => 
            prev.filter(review => review.item.id !== item.id)
        )
        setShowReviewModal(false)
        setCurrentReview(null)
    }

    const clearAllPendingReviews = () => {
        setPendingReviews([])
        localStorage.removeItem('pending_reviews')
    }

    return {
        pendingReviews,
        showReviewModal,
        currentReview,
        addPendingReview,
        skipReview,
        completeReview,
        clearAllPendingReviews,
    }
}


