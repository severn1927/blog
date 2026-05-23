import { Megaphone } from 'lucide-react';

export default function Announcement() {
  return (
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-start gap-2">
        <span className="inline-flex items-center gap-1 shrink-0 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-0.5">
          <Megaphone className="w-3 h-3" />
          公告
        </span>
        <p className="text-sm text-amber-800">
          欢迎使用 ProjectShare 项目分享平台，请勿上传违法、违规内容。如有问题请通过帮助页面联系我们。
        </p>
      </div>
    </div>
  );
}
