export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-6">帮助中心</h2>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">如何上传项目？</h3>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>准备好项目文件夹，确保包含 <code className="bg-gray-100 px-1 rounded">index.html</code> 文件作为入口</li>
            <li>进入「项目列表」页面，点击「上传项目」按钮</li>
            <li>选择你的项目文件夹（或直接粘贴 HTML 代码）</li>
            <li>填写项目名称、分类和描述，点击「开始上传」</li>
            <li>上传完成后会自动生成分享链接</li>
          </ol>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">分享链接使用说明</h3>
          <p className="text-sm text-gray-600">
            每个项目都有唯一的分享链接。上传后默认开启分享，你可以随时在项目列表中切换分享状态来控制外部访问。
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">支持的项目类型</h3>
          <p className="text-sm text-gray-600 mb-2">
            支持静态网站项目，包括 HTML、CSS、JavaScript 及相关资源文件。项目文件夹必须包含 <code className="bg-gray-100 px-1 rounded">index.html</code> 文件。
          </p>
          <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
            <li>纯 HTML/CSS/JS 网站</li>
            <li>Axure、Figma 等导出的原型项目</li>
            <li>已构建输出的单页应用（Vue、React 等）</li>
            <li>其他静态资源集合</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">存储限制</h3>
          <p className="text-sm text-gray-600">
            每个用户拥有 30 MB 的存储空间。你可以在控制台首页查看空间使用情况。如需更多空间，请联系管理员。
          </p>
        </div>
      </div>
    </div>
  );
}
