import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('adds player with default buyIn/remain equal to unit and result 0', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect((screen.getByLabelText('买入') as HTMLInputElement).value).toBe(
      '2000',
    )
    expect((screen.getByLabelText('剩余') as HTMLInputElement).value).toBe(
      '2000',
    )
    expect(screen.getByLabelText('结果').textContent).toBe('0')
  })

  it('updates result when remain changes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    const remain = screen.getByLabelText('剩余')
    await user.clear(remain)
    await user.type(remain, '2500')
    fireEvent.blur(remain)
    expect(screen.getByLabelText('结果').textContent).toBe('+500')
  })

  it('steps buy-in by unitPerHand', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    await user.click(screen.getByRole('button', { name: '增加买入' }))
    expect(screen.getByLabelText('买入')).toHaveProperty('value', '4000')
    expect(screen.getByLabelText('结果').textContent).toBe('-2000')
  })

  it('validates checksum messages', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    await user.click(screen.getByRole('button', { name: '校验' }))
    expect(screen.getByRole('status').textContent).toContain('校验通过')

    const remain = screen.getByLabelText('剩余')
    await user.clear(remain)
    await user.type(remain, '2100')
    fireEvent.blur(remain)
    await user.click(screen.getByRole('button', { name: '校验' }))
    expect(screen.getByRole('status').textContent).toContain('多出来的筹码')
  })

  it('requires confirm before delete', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    await user.click(screen.getByRole('button', { name: /删除/ }))
    expect(screen.getByRole('dialog', { name: /删除人员/ })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByLabelText('买入')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /删除/ }))
    await user.click(screen.getByRole('button', { name: '确定删除' }))
    expect(screen.getByText(/暂无人员/)).toBeTruthy()
  })

  it('clears scores but keeps names', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    const name = screen.getByLabelText('姓名')
    await user.type(name, '张三')
    await user.click(screen.getByRole('button', { name: '增加买入' }))
    // 放不下全部按钮时「清空记分」在「更多」里
    let clearScoreBtn = screen.queryByRole('button', { name: '清空记分' })
    if (!clearScoreBtn) {
      await user.click(screen.getByRole('button', { name: '更多' }))
      clearScoreBtn = screen.getByRole('button', { name: '清空记分' })
    }
    await user.click(clearScoreBtn)
    const dialog = screen.getByRole('dialog', { name: /清空记分/ })
    await user.click(within(dialog).getByRole('button', { name: '确定清空' }))
    expect(screen.getByLabelText('姓名')).toHaveProperty('value', '张三')
    expect(screen.getByLabelText('买入')).toHaveProperty('value', '2000')
    expect(screen.getByLabelText('剩余')).toHaveProperty('value', '2000')
    expect(screen.getByLabelText('结果').textContent).toBe('0')
  })

  it('rejects non-integer input in buy-in field', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))
    const buyIn = screen.getByLabelText('买入') as HTMLInputElement
    await user.clear(buyIn)
    await user.type(buyIn, '1.5')
    // decimal rejected: should not become 1.5
    expect(buyIn.value.includes('.')).toBe(false)
  })

  it('blurs name/buyIn/remain on Enter', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '添加' }))

    const name = screen.getByLabelText('姓名') as HTMLInputElement
    name.focus()
    expect(document.activeElement).toBe(name)
    await user.keyboard('{Enter}')
    expect(document.activeElement).not.toBe(name)

    const buyIn = screen.getByLabelText('买入') as HTMLInputElement
    buyIn.focus()
    expect(document.activeElement).toBe(buyIn)
    await user.keyboard('{Enter}')
    expect(document.activeElement).not.toBe(buyIn)

    const remain = screen.getByLabelText('剩余') as HTMLInputElement
    remain.focus()
    expect(document.activeElement).toBe(remain)
    await user.keyboard('{Enter}')
    expect(document.activeElement).not.toBe(remain)
  })
})
