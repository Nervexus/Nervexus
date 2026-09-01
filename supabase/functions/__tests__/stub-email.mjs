export const sends=[];
export let nextResult={ok:true};
export function setNextResult(r){ nextResult=r; }
export async function sendReminderEmail(to,subject,text,provider,html){
  sends.push({to,subject,text,provider,html}); return nextResult;
}
