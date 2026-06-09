
import { maxios } from "../../api/axiosConfig";

// 게시글 등록
export const insertBoard = (formData) => 
    maxios.post('/board', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

// 에디터 이미지 업로드
export const insertEditorImage = (formData) =>
    maxios.post('/board/imageUpload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const getBoardList = (params) => maxios.get('/board', { params });
export const getPostDetail = (seq) =>  maxios.get(`/board/${seq}`)
export const deletePost = (seq) =>  maxios.delete(`/board/${seq}`);
export const downFiles = (fileSeq) => maxios.get(`/board/download/${fileSeq}`, { responseType: 'blob' });
export const updateBoard = (seq, formData) => {
  return maxios.put(`/board/${seq}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

//댓글 
export const insertComment = (post_seq, content) => {
  return maxios.post(`/board/${post_seq}/comments`, { content });
};
export const deleteComment = (comment_seq) => maxios.delete(`/board/comments/${comment_seq}`);
export const updateComment = (comment_seq,editComment) => maxios.put(`/board/comments/${comment_seq}`,editComment);
