import yfinance as yf

dat = yf.Ticker(("SBIN.NS"))
print(dat.history())
