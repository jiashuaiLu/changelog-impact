# 限流应对方案（选项 1：指数退避 + 抖动）

适用：你在调用模型 API 时出现 429 / rate limit / timeout，希望“少失败且合规”。

核心原则：
- 不做 1s 固定间隔硬刷。
- 使用指数退避（exponential backoff）+ 抖动（jitter）。
- 合并请求、控制并发、缓存结果。

---

## 1) 推荐参数（通用）

- max_retries: 6
- base_delay_seconds: 2
- max_delay_seconds: 60
- jitter: full jitter（随机 0 ~ 当前 delay）

等待序列（上限 60s）：
- 2s, 4s, 8s, 16s, 32s, 60s
每次再乘以随机因子（0~1），避免多客户端同步重试雪崩。

遇到以下错误触发退避：
- HTTP 429
- HTTP 503
- 网络超时 / 连接重置

遇到 400/401/403 一般不重试（属于请求或权限问题）。

---

## 2) Python 示例（requests/httpx 风格伪代码）

```python
import random
import time

MAX_RETRIES = 6
BASE = 2
MAX_DELAY = 60

for attempt in range(MAX_RETRIES):
    try:
        resp = call_llm_api()
        return resp
    except RateLimitError:
        delay = min(MAX_DELAY, BASE * (2 ** attempt))
        sleep = random.random() * delay  # full jitter
        time.sleep(sleep)
    except TransientNetworkError:
        delay = min(MAX_DELAY, BASE * (2 ** attempt))
        time.sleep(random.random() * delay)

raise Exception("LLM API call failed after retries")
```

如果服务端返回 `Retry-After`，优先尊重它。

---

## 3) Node/TS 示例（伪代码）

```ts
const MAX_RETRIES = 6;
const BASE = 2;
const MAX_DELAY = 60;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    const resp = await callLLM();
    return resp;
  } catch (e: any) {
    if (!isRetryable(e)) throw e;
    const delay = Math.min(MAX_DELAY, BASE * Math.pow(2, attempt));
    const jitter = Math.random() * delay;
    await sleep(jitter * 1000);
  }
}
```

---

## 4) 降低被限流概率的 5 个工程技巧

1) 合并请求
- 把多个小请求合成 1 个大请求（一次生成 10 条内容）。

2) 控制并发
- 并发改为 1-3；不要 10 并发。

3) 缓存
- 相同 prompt + 参数的结果缓存，避免重复调用。

4) 选择合适的模型与 token
- 减少 max_tokens，避免不必要的长输出。

5) 失败分级
- 429/503/超时才重试；其它错误快速失败并报警。

---

## 5) 你需要补充的 3 个信息（我可给你精确参数）

1) 哪家 API（OpenAI/Anthropic/自建）？
2) 限流错误原文（含 headers 更好，比如 Retry-After）
3) 你当前并发数、每分钟请求数、平均 tokens

