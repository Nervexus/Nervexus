export const pushes=[];
export async function sendPushToUser(admin,userId,payload){ pushes.push({userId,...payload}); return {ok:true}; }
