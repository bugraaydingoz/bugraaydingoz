import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Bugra Aydingoz - Software Engineer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Merhaba</h1>

        <p className={styles.description}>You can reach me at:</p>
        <a href="mailto:hello@bugraaydingoz.com" className={styles.link}>
          hello@bugraaydingoz.com
        </a>
      </main>
    </div>
  )
}
