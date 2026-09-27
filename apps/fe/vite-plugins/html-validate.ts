import { HtmlValidate } from 'html-validate';
import pc from 'picocolors';
import type { Plugin } from 'vite';

export const htmlValidatePlugin = (): Plugin => {
  const validator = new HtmlValidate();

  return {
    name: 'html-validate',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        const originalEnd = res.end.bind(res);

        res.end = (chunk?: unknown, ...rest: unknown[]) => {
          const contentType = res.getHeader('content-type');
          if (typeof contentType === 'string' && contentType.includes('text/html') && chunk) {
            const html = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk);
            validator
              .validateString(html)
              .then((report) => {
                if (!report.valid) {
                  server.config.logger.warn(
                    pc.yellow(
                      `\n[html-validate] ${report.results.length > 1 ? `${report.results.length} file(s) with` : ''} HTML issues:\n`
                    ) +
                      report.results
                        .flatMap((r) => r.messages)
                        .map((m) => `  ${pc.cyan(m.ruleId ?? 'unknown')} ${m.message} (line ${m.line}:${m.col})`)
                        .join('\n')
                  );
                }
              })
              .catch(() => {
                /* ignore validation errors */
              });
          }
          return (originalEnd as (...args: unknown[]) => unknown)(chunk, ...rest) as ReturnType<typeof res.end>;
        };

        next();
      });
    },
  };
};
